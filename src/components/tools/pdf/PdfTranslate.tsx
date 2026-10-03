"use client";

import * as React from "react";
import {
  Languages,
  Download,
  Copy,
  Check,
  FileText,
  Loader2,
  Shield,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { getPdfJs } from "@/lib/pdf-helpers";
import { downloadBlob, formatBytes } from "@/lib/utils";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

interface PageData {
  pageNumber: number;
  originalText: string;
  editedText: string;
}

export function PdfTranslate() {
  const [file, setFile] = React.useState<File | null>(null);
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [pages, setPages] = React.useState<PageData[]>([]);
  const [selectedPage, setSelectedPage] = React.useState(1);
  const [copied, setCopied] = React.useState(false);

  const handleFileAdded = async (files: File[]) => {
    const selected = files[0];
    if (!selected) return;
    setFile(selected);
    setIsExtracting(true);

    try {
      const pdfjs = await getPdfJs();
      const arrayBuffer = await selected.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;

      const extracted: PageData[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const pageStr = textContent.items
          .map((item: any) => item.str || "")
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        extracted.push({
          pageNumber: i,
          originalText: pageStr,
          editedText: "",
        });
      }

      setPages(extracted);
      setSelectedPage(1);
      toast.success(`Extracted text from ${doc.numPages} page(s).`);
    } catch (err: any) {
      toast.error(`Could not read PDF: ${err.message}`);
      setFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleUpdateText = (pageIndex: number, newText: string) => {
    setPages((prev) => {
      const next = [...prev];
      if (next[pageIndex]) {
        next[pageIndex].editedText = newText;
      }
      return next;
    });
  };

  const handleCopyText = () => {
    const fullText = pages
      .map((p) => `--- Page ${p.pageNumber} ---\n${p.editedText || p.originalText}`)
      .join("\n\n");
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("Copied extracted text to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const content = pages
      .map((p) => `[Page ${p.pageNumber}]\n${p.editedText || p.originalText}`)
      .join("\n\n");
    downloadBlob(
      new Blob([content], { type: "text/plain;charset=utf-8" }),
      `${file?.name.replace(/\.pdf$/i, "")}-text.txt`
    );
    toast.success("Downloaded extracted text");
  };

  const handleDownloadPdf = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      for (const p of pages) {
        const page = pdfDoc.addPage([595.28, 841.89]); // A4
        let y = 800;

        page.drawText(`Extracted text - Page ${p.pageNumber}`, {
          x: 50,
          y,
          size: 11,
          font: fontBold,
          color: rgb(0.3, 0.3, 0.3),
        });
        y -= 25;

        const textToRender = p.editedText || p.originalText;
        const words = textToRender.split(" ");
        let line = "";

        for (const w of words) {
          const testLine = line + (line ? " " : "") + w;
          const textWidth = font.widthOfTextAtSize(testLine, 10);
          if (textWidth > 495 && line) {
            if (y < 60) break;
            page.drawText(line, { x: 50, y, size: 10, font, color: rgb(0.1, 0.1, 0.1) });
            y -= 14;
            line = w;
          } else {
            line = testLine;
          }
        }
        if (line && y >= 60) {
          page.drawText(line, { x: 50, y, size: 10, font, color: rgb(0.1, 0.1, 0.1) });
        }
      }

      const pdfBytes = await pdfDoc.save();
      downloadBlob(
        new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" }),
        `${file?.name.replace(/\.pdf$/i, "")}-text.pdf`
      );
      toast.success("Exported text PDF");
    } catch (e: any) {
      toast.error(`Failed to export PDF: ${e.message}`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setSelectedPage(1);
  };

  const currentPage = pages[selectedPage - 1];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
      <ToolHeader
        category="PDF Intelligence"
        title="Extract PDF Text"
        description="Extract, edit, copy, and export PDF text locally without uploading your document."
        onReset={handleReset}
      />

      <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs sm:text-sm">
        <Shield className="w-4 h-4 shrink-0" />
        <span>
          <strong>Private by design:</strong> PDF text is extracted and edited on this device. No translation service or network upload is used.
        </span>
      </div>

      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileAdded}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          title="Drop PDF to extract text"
          subtitle="Text extraction, editing, and export run locally"
        />
      ) : isExtracting ? (
        <div className="p-12 text-center border border-border bg-card rounded-2xl space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-sm font-semibold">Extracting PDF text content...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Language selector & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <Languages className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} • {pages.length} pages
                </p>
              </div>
            </div>

            {/* Export buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                Copy
              </button>
              <button
                onClick={handleDownloadTxt}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition"
              >
                <Download className="w-3.5 h-3.5" />
                Text
              </button>
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Page navigator tabs */}
          {pages.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
              {pages.map((p) => (
                <button
                  key={p.pageNumber}
                  onClick={() => setSelectedPage(p.pageNumber)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                    selectedPage === p.pageNumber
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  Page {p.pageNumber}
                </button>
              ))}
            </div>
          )}

          {/* Side by side view */}
          {currentPage && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Original Text (Page {currentPage.pageNumber})
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    {currentPage.originalText.split(" ").length} words
                  </span>
                </div>
                <div className="p-3 bg-muted/20 border border-border/50 rounded-lg min-h-[300px] max-h-[500px] overflow-y-auto text-xs leading-relaxed text-foreground/80 font-mono whitespace-pre-wrap">
                  {currentPage.originalText || "No text found on this page."}
                </div>
              </div>

              {/* Editable extracted text */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                    Edited Text
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    {currentPage.editedText
                      ? `${currentPage.editedText.split(" ").length} words`
                      : "Optional edits"}
                  </span>
                </div>
                <textarea
                  value={currentPage.editedText}
                  onChange={(e) =>
                    handleUpdateText(selectedPage - 1, e.target.value)
                  }
                  placeholder="Optional: edit the extracted text locally..."
                  className="w-full p-3 bg-background border border-border rounded-lg min-h-[300px] max-h-[500px] text-xs leading-relaxed text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
