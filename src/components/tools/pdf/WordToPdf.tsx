"use client";

import * as React from "react";
import { FileText, Download, Loader2 } from "lucide-react";
import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";
import JSZip from "jszip";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { downloadBlob, formatBytes } from "@/lib/utils";

export function WordToPdf() {
  const [file, setFile] = React.useState<File | null>(null);
  const [extractedParagraphs, setExtractedParagraphs] = React.useState<string[]>([]);
  const [isConverting, setIsConverting] = React.useState(false);

  const handleDocx = async (selected: File) => {
    setFile(selected);
    setIsConverting(true);
    setExtractedParagraphs([]);

    try {
      const zip = await JSZip.loadAsync(selected);
      const docXml = await zip.file("word/document.xml")?.async("text");

      if (!docXml) {
        throw new Error("Invalid .docx file: word/document.xml not found.");
      }

      // Parse XML paragraphs
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(docXml, "text/xml");
      const paragraphs = Array.from(xmlDoc.getElementsByTagName("w:p"));

      const parsedTexts: string[] = [];
      for (const p of paragraphs) {
        const textNodes = Array.from(p.getElementsByTagName("w:t"));
        const pText = textNodes.map((t) => t.textContent || "").join("");
        if (pText.trim()) {
          parsedTexts.push(pText.trim());
        }
      }

      setExtractedParagraphs(parsedTexts);
      toast.success(`Extracted ${parsedTexts.length} paragraph(s) from ${selected.name}`);
    } catch (err: any) {
      toast.error(`Could not read Word document: ${err.message}`);
      setFile(null);
    } finally {
      setIsConverting(false);
    }
  };

  const exportPdf = async () => {
    if (!file || extractedParagraphs.length === 0) return;
    setIsConverting(true);

    try {
      const pdfDoc = await PDFDocument.create();
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const [pageWidth, pageHeight] = PageSizes.A4;
      const margin = 50;
      const maxLineWidth = pageWidth - margin * 2;
      const fontSize = 11;
      const lineHeight = 16;

      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let currentY = pageHeight - margin;

      // Draw title
      currentPage.drawText(file.name.replace(/\.docx$/i, ""), {
        x: margin,
        y: currentY,
        size: 16,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      currentY -= 30;

      for (const paragraph of extractedParagraphs) {
        const words = paragraph.split(" ");
        let line = "";

        for (const word of words) {
          const testLine = line ? `${line} ${word}` : word;
          const lineWidth = helvetica.widthOfTextAtSize(testLine, fontSize);

          if (lineWidth > maxLineWidth) {
            if (currentY < margin + lineHeight) {
              currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
              currentY = pageHeight - margin;
            }
            currentPage.drawText(line, {
              x: margin,
              y: currentY,
              size: fontSize,
              font: helvetica,
              color: rgb(0.15, 0.15, 0.15),
            });
            currentY -= lineHeight;
            line = word;
          } else {
            line = testLine;
          }
        }

        if (line) {
          if (currentY < margin + lineHeight) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            currentY = pageHeight - margin;
          }
          currentPage.drawText(line, {
            x: margin,
            y: currentY,
            size: fontSize,
            font: helvetica,
            color: rgb(0.15, 0.15, 0.15),
          });
          currentY -= lineHeight * 1.5; // paragraph spacing
        }
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      downloadBlob(blob, `${file.name.replace(/\.docx$/i, "")}.pdf`);
      toast.success("Word document successfully converted to PDF!");
    } catch (err: any) {
      toast.error(`Conversion failed: ${err.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setExtractedParagraphs([]);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <ToolHeader
        category="PDF Utilities"
        title="WORD to PDF"
        description="Convert Microsoft Word (.docx) documents into clean, standard PDF files completely in your browser."
        onReset={reset}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={(files) => files[0] && handleDocx(files[0])}
          accept={{
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
          }}
          maxFiles={1}
          title="Upload Word (.docx) document"
          subtitle="Document structure and text are formatted into vector PDF client-side."
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
              Document Preview ({extractedParagraphs.length} paragraphs)
            </h3>
            <div className="max-h-72 overflow-y-auto space-y-2 p-4 rounded-xl bg-muted/20 border border-border text-xs leading-relaxed text-foreground">
              {extractedParagraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={exportPdf}
              disabled={isConverting || extractedParagraphs.length === 0}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all disabled:opacity-40"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Converting to PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Convert & Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
