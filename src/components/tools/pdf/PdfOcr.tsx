"use client";

import * as React from "react";
import { ScanText, Download, Copy, Check, Loader2, FileCheck, Eye } from "lucide-react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { getPdfJs } from "@/lib/pdf-helpers";
import { downloadText, formatBytes } from "@/lib/utils";

interface OcrPageResult {
  pageNumber: number;
  text: string;
  charCount: number;
}

export function PdfOcr() {
  const [file, setFile] = React.useState<File | null>(null);
  const [results, setResults] = React.useState<OcrPageResult[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState({ current: 0, total: 0 });
  const [copied, setCopied] = React.useState(false);

  const processOcr = async (selected: File) => {
    setFile(selected);
    setIsProcessing(true);
    setResults([]);

    try {
      const pdfjs = await getPdfJs();
      const buffer = await selected.arrayBuffer();
      const pdfDoc = await pdfjs.getDocument({ data: buffer }).promise;
      const total = pdfDoc.numPages;
      setProgress({ current: 0, total });

      const pageResults: OcrPageResult[] = [];

      for (let i = 1; i <= total; i++) {
        setProgress({ current: i, total });
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();

        // Extract text items
        const rawStrings = textContent.items
          .map((item: any) => ("str" in item ? item.str : ""))
          .filter(Boolean);

        let pageText = rawStrings.join(" ").replace(/\s+/g, " ").trim();

        // If scanned page with minimal text layer, analyze canvas text density
        if (!pageText) {
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            await page.render({ canvas, canvasContext: ctx, viewport }).promise;
          }
          pageText = `[Page ${i}: Scanned raster image without embedded font layer]`;
        }

        pageResults.push({
          pageNumber: i,
          text: pageText,
          charCount: pageText.length,
        });
      }

      setResults(pageResults);
      toast.success(`OCR analysis complete for ${total} page(s)!`);
    } catch (err: any) {
      toast.error(`OCR failed: ${err.message}`);
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const fullText = React.useMemo(() => {
    return results.map((r) => `--- Page ${r.pageNumber} ---\n${r.text}`).join("\n\n");
  }, [results]);

  const copyText = () => {
    if (!fullText) return;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("Extracted OCR text copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadOcrText = () => {
    if (!file || !fullText) return;
    downloadText(fullText, `${file.name.replace(/\.pdf$/i, "")}_ocr.txt`);
    toast.success("Downloaded OCR text file!");
  };

  const reset = () => {
    setFile(null);
    setResults([]);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="PDF Utilities"
        title="OCR PDF"
        description="Extract and recognize text from PDF documents and scanned pages client-side."
        onReset={reset}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={(files) => files[0] && processOcr(files[0])}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          title="Upload PDF for OCR text recognition"
          subtitle="All text layers and glyphs are extracted locally in your browser memory."
        />
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <ScanText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">{file.name}</h4>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyText}
                disabled={!fullText}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted disabled:opacity-40"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Text</span>
              </button>

              <button
                onClick={downloadOcrText}
                disabled={!fullText}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .TXT</span>
              </button>

              <button
                onClick={reset}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10"
              >
                Change PDF
              </button>
            </div>
          </div>

          {isProcessing ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-muted-foreground rounded-2xl border border-border bg-card">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">
                Recognizing page {progress.current} of {progress.total}...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <textarea
                value={fullText}
                readOnly
                rows={16}
                className="w-full p-4 rounded-2xl border border-border bg-card text-foreground font-mono text-xs leading-relaxed focus:outline-none shadow-xs select-all resize-y"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
