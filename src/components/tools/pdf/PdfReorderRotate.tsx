"use client";

import * as React from "react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { PDFDocument, degrees } from "pdf-lib";
import { toast } from "sonner";
import {
  RotateCw,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Download,
  Loader2,
  RefreshCw,
  FileCheck,
} from "lucide-react";
import { formatBytes, downloadBlob } from "@/lib/utils";
import { renderPdfThumbnails, RenderedPageInfo } from "@/lib/pdf-helpers";

interface PageState {
  originalIndex: number; // 0-based original index
  displayNum: number;
  rotation: number; // 0, 90, 180, 270
  dataUrl: string;
}

export function PdfReorderRotate() {
  const [file, setFile] = React.useState<File | null>(null);
  const [pages, setPages] = React.useState<PageState[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleFileAdded = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setIsLoading(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const count = pdf.getPageCount();

      const thumbs = await renderPdfThumbnails(selectedFile, 50, 0.4);
      const initialPages: PageState[] = thumbs.map((t, idx) => {
        const page = pdf.getPage(idx);
        const existingRot = page.getRotation().angle || 0;
        return {
          originalIndex: idx,
          displayNum: idx + 1,
          rotation: existingRot,
          dataUrl: t.dataUrl,
        };
      });

      setPages(initialPages);
      toast.success(`Loaded ${count} pages from ${selectedFile.name}`);
    } catch (err: any) {
      toast.error("Failed to load PDF: " + err.message);
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const rotatePage = (index: number, degDelta: number) => {
    setPages((prev) => {
      const updated = [...prev];
      const newRot = (updated[index].rotation + degDelta + 360) % 360;
      updated[index] = { ...updated[index], rotation: newRot };
      return updated;
    });
  };

  const rotateAllPages = (degDelta: number) => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        rotation: (p.rotation + degDelta + 360) % 360,
      }))
    );
    toast.info(`Rotated all pages by ${degDelta}°`);
  };

  const movePage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= pages.length) return;
    setPages((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[target];
      updated[target] = temp;
      return updated;
    });
  };

  const removePage = (index: number) => {
    if (pages.length <= 1) {
      toast.warning("A PDF must have at least one page.");
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
    toast.info("Removed page");
  };

  const exportPdf = async () => {
    if (!file || pages.length === 0) return;
    setIsExporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buffer);
      const newDoc = await PDFDocument.create();

      for (const p of pages) {
        const [copiedPage] = await newDoc.copyPages(srcDoc, [p.originalIndex]);
        copiedPage.setRotation(degrees(p.rotation));
        newDoc.addPage(copiedPage);
      }

      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      downloadBlob(blob, `reordered_${file.name}`);
      toast.success("Reordered & rotated PDF downloaded!");
    } catch (err: any) {
      toast.error("Export failed: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPages([]);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="PDF Utilities"
        title="PDF Page Reorder & Rotate"
        description="Rearrange page sequence and rotate individual pages (90°/180°) or the whole document."
        onReset={resetAll}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileAdded}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          title="Upload a PDF to reorder or rotate"
          subtitle="Everything runs in your local memory. Rotate pages and drag/shift page sequences."
        />
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-4 rounded-2xl border border-border bg-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-primary" />
                {file.name}
              </h4>
              <p className="text-xs text-muted-foreground">
                {formatBytes(file.size)} • {pages.length} page(s) in sequence
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => rotateAllPages(90)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-medium"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate All 90° CW</span>
              </button>

              <button
                onClick={() => rotateAllPages(180)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rotate All 180°</span>
              </button>

              <button
                onClick={resetAll}
                className="px-3 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 text-xs font-medium"
              >
                Change PDF
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">Generating page thumbnails...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {pages.map((p, idx) => (
                <div
                  key={`${p.originalIndex}-${idx}`}
                  className="rounded-2xl border border-border bg-card p-3 shadow-xs space-y-3 flex flex-col"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">
                      #{idx + 1}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Orig p.{p.displayNum}
                    </span>
                  </div>

                  {/* Thumbnail with rotation */}
                  <div className="relative aspect-[3/4] bg-muted/50 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-border/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.dataUrl}
                      alt={`Page ${idx + 1}`}
                      style={{
                        transform: `rotate(${p.rotation}deg)`,
                        transition: "transform 0.2s ease-in-out",
                      }}
                      className="max-h-full max-w-full object-contain shadow-xs rounded"
                    />
                    {p.rotation !== 0 && (
                      <span className="absolute bottom-1 right-1 bg-black/70 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                        {p.rotation}°
                      </span>
                    )}
                  </div>

                  {/* Page Action Controls */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/40">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => rotatePage(idx, -90)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Rotate 90° CCW"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => rotatePage(idx, 90)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Rotate 90° CW"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => movePage(idx, -1)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20"
                        title="Move Left"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => movePage(idx, 1)}
                        disabled={idx === pages.length - 1}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20"
                        title="Move Right"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removePage(idx)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-1"
                        title="Delete Page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Export Action */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={exportPdf}
              disabled={isExporting || pages.length === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Save & Download Modified PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
