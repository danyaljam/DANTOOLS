"use client";

import * as React from "react";
import { Download, Trash2, X, Loader2, AlertCircle } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { renderPdfThumbnails, RenderedPageInfo, parsePageRanges } from "@/lib/pdf-helpers";
import { downloadBlob, formatBytes } from "@/lib/utils";

export function PdfRemovePages() {
  const [file, setFile] = React.useState<File | null>(null);
  const [thumbnails, setThumbnails] = React.useState<RenderedPageInfo[]>([]);
  const [pagesToRemove, setPagesToRemove] = React.useState<number[]>([]);
  const [rangeInput, setRangeInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleFileAdded = async (files: File[]) => {
    const selected = files[0];
    if (!selected) return;
    setFile(selected);
    setIsLoading(true);
    setPagesToRemove([]);
    setRangeInput("");
    try {
      const thumbs = await renderPdfThumbnails(selected, 60, 0.4);
      setThumbnails(thumbs);
      toast.success(`Loaded ${thumbs.length} page(s) from ${selected.name}`);
    } catch (err: any) {
      toast.error(`Could not read PDF: ${err.message}`);
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePageToRemove = (pageNum: number) => {
    setPagesToRemove((prev) =>
      prev.includes(pageNum) ? prev.filter((p) => p !== pageNum) : [...prev, pageNum].sort((a, b) => a - b)
    );
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRangeInput(val);
    if (!thumbnails.length) return;
    const parsed = parsePageRanges(val, thumbnails.length);
    setPagesToRemove(parsed);
  };

  const executeRemove = async () => {
    if (!file || pagesToRemove.length === 0) {
      toast.warning("Please select at least one page to delete.");
      return;
    }
    if (pagesToRemove.length >= thumbnails.length) {
      toast.warning("You cannot remove all pages from a PDF.");
      return;
    }

    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();

      const pagesToKeep: number[] = [];
      for (let i = 1; i <= thumbnails.length; i++) {
        if (!pagesToRemove.includes(i)) {
          pagesToKeep.push(i - 1);
        }
      }

      const copied = await newDoc.copyPages(srcDoc, pagesToKeep);
      copied.forEach((page) => newDoc.addPage(page));

      const bytes = await newDoc.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      downloadBlob(blob, `removed_pages_${file.name}`);
      toast.success(`Removed ${pagesToRemove.length} page(s) successfully!`);
    } catch (err: any) {
      toast.error(`Failed to remove pages: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setThumbnails([]);
    setPagesToRemove([]);
    setRangeInput("");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="PDF Utilities"
        title="Remove PDF Pages"
        description="Select and delete unwanted pages from your document. Processed 100% locally in your browser."
        onReset={reset}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileAdded}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          title="Select PDF to remove pages"
          subtitle="Click or drop a PDF to see thumbnails and remove pages."
        />
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-border bg-card flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-foreground">{file.name}</h3>
              <p className="text-xs text-muted-foreground">
                {formatBytes(file.size)} • {thumbnails.length} total pages • {pagesToRemove.length} marked for removal
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagesToRemove([])}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
              >
                Clear Selection
              </button>
              <button
                onClick={reset}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10"
              >
                Change PDF
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground">
              Pages to Delete (e.g. "2, 4-6")
            </label>
            <input
              type="text"
              value={rangeInput}
              onChange={handleRangeChange}
              placeholder="e.g. 1, 3, 5-7"
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary"
            />
            <p className="text-[11px] text-muted-foreground">
              Click individual page thumbnails below to mark them with a red deletion tag.
            </p>
          </div>

          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">Generating page thumbnails...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {thumbnails.map((thumb) => {
                const isMarked = pagesToRemove.includes(thumb.pageNumber);
                return (
                  <div
                    key={thumb.pageNumber}
                    onClick={() => togglePageToRemove(thumb.pageNumber)}
                    className={`group relative rounded-xl border-2 p-2 cursor-pointer transition-all bg-card flex flex-col items-center ${
                      isMarked
                        ? "border-destructive bg-destructive/5 opacity-80"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="relative w-full aspect-[3/4] bg-muted rounded-lg overflow-hidden flex items-center justify-center border border-border/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumb.dataUrl}
                        alt={`Page ${thumb.pageNumber}`}
                        className={`object-contain w-full h-full transition-opacity ${
                          isMarked ? "grayscale opacity-50" : ""
                        }`}
                      />
                      {isMarked && (
                        <div className="absolute inset-0 bg-destructive/30 flex items-center justify-center">
                          <X className="w-10 h-10 text-destructive stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs font-semibold ${
                        isMarked ? "text-destructive line-through" : "text-foreground"
                      }`}
                    >
                      Page {thumb.pageNumber}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              onClick={executeRemove}
              disabled={isProcessing || pagesToRemove.length === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm shadow-md hover:bg-destructive/90 transition-all disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Removing Pages...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Remove {pagesToRemove.length} Page(s) & Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
