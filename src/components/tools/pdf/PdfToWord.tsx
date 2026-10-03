"use client";

import * as React from "react";
import { FileText, Download, Loader2, Check } from "lucide-react";
import JSZip from "jszip";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { getPdfJs } from "@/lib/pdf-helpers";
import { downloadBlob, formatBytes } from "@/lib/utils";

interface PageContent {
  pageNumber: number;
  lines: string[];
}

export function PdfToWord() {
  const [file, setFile] = React.useState<File | null>(null);
  const [pages, setPages] = React.useState<PageContent[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handlePdf = async (selected: File) => {
    setFile(selected);
    setIsProcessing(true);
    setPages([]);

    try {
      const pdfjs = await getPdfJs();
      const buffer = await selected.arrayBuffer();
      const pdfDoc = await pdfjs.getDocument({ data: buffer }).promise;
      const extracted: PageContent[] = [];

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const lines: string[] = [];
        let currentLine = "";

        textContent.items.forEach((item: any) => {
          if ("str" in item) {
            currentLine += item.str + " ";
            if (item.hasEOL) {
              lines.push(currentLine.trim());
              currentLine = "";
            }
          }
        });

        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }

        extracted.push({
          pageNumber: i,
          lines: lines.length ? lines : ["[Page without selectable text]"],
        });
      }

      setPages(extracted);
      toast.success(`Extracted content from ${pdfDoc.numPages} page(s).`);
    } catch (err: any) {
      toast.error(`Could not read PDF: ${err.message}`);
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Builds standard Office Open XML (.docx) package with JSZip
   */
  const exportDocx = async () => {
    if (!file || pages.length === 0) return;
    setIsProcessing(true);

    try {
      const zip = new JSZip();

      // [Content_Types].xml
      zip.file(
        "[Content_Types].xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
      );

      // _rels/.rels
      zip.file(
        "_rels/.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
      );

      // word/_rels/document.xml.rels
      zip.folder("word")?.folder("_rels")?.file(
        "document.xml.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`
      );

      // word/document.xml
      const paragraphsXml = pages
        .map((p) => {
          const pageHeader = `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>Page ${p.pageNumber}</w:t></w:r></w:p>`;
          const linesXml = p.lines
            .map(
              (line) =>
                `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`
            )
            .join("");
          return pageHeader + linesXml;
        })
        .join("");

      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphsXml}
    <w:sectPr/>
  </w:body>
</w:document>`;

      zip.folder("word")?.file("document.xml", documentXml);

      const blob = await zip.generateAsync({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      downloadBlob(blob, `${file.name.replace(/\.pdf$/i, "")}.docx`);
      toast.success("Word document (.docx) successfully downloaded!");
    } catch (err: any) {
      toast.error(`Export failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const escapeXml = (unsafe: string) => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "&": return "&amp;";
        case "'": return "&apos;";
        case '"': return "&quot;";
        default: return c;
      }
    });
  };

  const reset = () => {
    setFile(null);
    setPages([]);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <ToolHeader
        category="PDF Utilities"
        title="PDF to WORD"
        description="Convert PDF documents into editable Microsoft Word (.docx) files with page formatting."
        onReset={reset}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={(files) => files[0] && handlePdf(files[0])}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          title="Upload PDF to convert to Word"
          subtitle="Generates standard .docx format without transmitting files over the web."
        />
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">{file.name}</h4>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            </div>

            <button
              onClick={reset}
              className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border"
            >
              Change File
            </button>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-foreground">
              Document Preview ({pages.length} pages)
            </h3>
            <div className="max-h-80 overflow-y-auto space-y-4 p-4 rounded-xl bg-muted/20 border border-border text-xs leading-relaxed text-foreground">
              {pages.map((p) => (
                <div key={p.pageNumber} className="space-y-1">
                  <span className="font-bold text-primary block">--- Page {p.pageNumber} ---</span>
                  {p.lines.map((l, idx) => (
                    <p key={idx}>{l}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={exportDocx}
              disabled={isProcessing || pages.length === 0}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Word File...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Word Document (.docx)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
