"use client";

import * as React from "react";
import { EyeOff, Download, Trash2, ShieldAlert, Loader2, Undo } from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { renderPdfThumbnails, RenderedPageInfo } from "@/lib/pdf-helpers";
import { downloadBlob, formatBytes } from "@/lib/utils";

interface RedactBox {
  id: string;
  pageNumber: number;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
}

export function PdfRedact() {
  const [file, setFile] = React.useState<File | null>(null);
  const [thumbnails, setThumbnails] = React.useState<RenderedPageInfo[]>([]);
  const [selectedPage, setSelectedPage] = React.useState<number>(1);
  const [redactionBoxes, setRedactionBoxes] = React.useState<RedactBox[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const isDragging = React.useRef(false);
  const startCoords = React.useRef({ x: 0, y: 0 });
  const [activeRect, setActiveRect] = React.useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const handleFileAdded = async (files: File[]) => {
    const selected = files[0];
    if (!selected) return;
    setFile(selected);
    try {
      const thumbs = await renderPdfThumbnails(selected, 30, 0.5);
      setThumbnails(thumbs);
      setSelectedPage(1);
      setRedactionBoxes([]);
      toast.success(`Loaded ${selected.name}`);
    } catch (err: any) {
      toast.error(`Could not read PDF: ${err.message}`);
      setFile(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    isDragging.current = true;
    startCoords.current = { x, y };
    setActiveRect({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const x = Math.min(startCoords.current.x, currentX);
    const y = Math.min(startCoords.current.y, currentY);
    const w = Math.abs(currentX - startCoords.current.x);
    const h = Math.abs(currentY - startCoords.current.y);

    setActiveRect({ x, y, w, h });
  };

  const handleMouseUp = () => {
    if (!isDragging.current || !containerRef.current || !activeRect) return;
    isDragging.current = false;

    if (activeRect.w > 10 && activeRect.h > 10) {
      const rect = containerRef.current.getBoundingClientRect();
      const newBox: RedactBox = {
        id: Math.random().toString(36).substring(7),
        pageNumber: selectedPage,
        xPct: (activeRect.x / rect.width) * 100,
        yPct: (activeRect.y / rect.height) * 100,
        widthPct: (activeRect.w / rect.width) * 100,
        heightPct: (activeRect.h / rect.height) * 100,
      };
      setRedactionBoxes((prev) => [...prev, newBox]);
      toast.info("Redaction blackout box applied!");
    }
    setActiveRect(null);
  };

  const removeBox = (id: string) => {
    setRedactionBoxes((prev) => prev.filter((b) => b.id !== id));
  };

  const executeRedact = async () => {
    if (!file || redactionBoxes.length === 0) {
      toast.warning("Please draw at least one redaction box.");
      return;
    }

    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      for (const box of redactionBoxes) {
        const pageIndex = box.pageNumber - 1;
        if (pageIndex >= 0 && pageIndex < pages.length) {
          const page = pages[pageIndex];
          const { width, height } = page.getSize();

          const posX = (box.xPct / 100) * width;
          const boxWidth = (box.widthPct / 100) * width;
          const boxHeight = (box.heightPct / 100) * height;
          // PDF Y is bottom-to-top
          const posY = height - (box.yPct / 100) * height - boxHeight;

          // Draw permanent blackout rectangle
          page.drawRectangle({
            x: posX,
            y: posY,
            width: boxWidth,
            height: boxHeight,
            color: rgb(0, 0, 0),
          });
        }
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      downloadBlob(blob, `redacted_${file.name}`);
      toast.success("Document permanently redacted and downloaded!");
    } catch (err: any) {
      toast.error(`Redaction failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setThumbnails([]);
    setRedactionBoxes([]);
  };

  const currentThumb = thumbnails.find((t) => t.pageNumber === selectedPage) || thumbnails[0];
  const currentPageBoxes = redactionBoxes.filter((b) => b.pageNumber === selectedPage);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="PDF Utilities"
        title="Redact PDF"
        description="Permanently blackout confidential data, personal names, account numbers, and classified text client-side."
        onReset={reset}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileAdded}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          title="Upload PDF to redact sensitive text"
          subtitle="Draw redaction blackout boxes over sensitive details. Permanent vector obliteration."
        />
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center font-bold">
                <EyeOff className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">{file.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} • {redactionBoxes.length} total redaction(s)
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setRedactionBoxes([])}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
              >
                Clear Boxes
              </button>
              <button
                onClick={reset}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10"
              >
                Change File
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Redactions Manager */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Active Redactions</h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-muted">
                    {currentPageBoxes.length} on this page
                  </span>
                </div>

                {/* Page Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground block">
                    Select Page to Redact
                  </label>
                  <select
                    value={selectedPage}
                    onChange={(e) => setSelectedPage(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground"
                  >
                    {thumbnails.map((t) => (
                      <option key={t.pageNumber} value={t.pageNumber}>
                        Page {t.pageNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {redactionBoxes.map((box, idx) => (
                    <div
                      key={box.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-muted/20 text-xs"
                    >
                      <span className="font-semibold text-foreground">
                        Blackout #{idx + 1} (Page {box.pageNumber})
                      </span>
                      <button
                        onClick={() => removeBox(box.id)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {redactionBoxes.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Drag a box on the page preview to blackout text.
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={executeRedact}
                disabled={isProcessing || redactionBoxes.length === 0}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm shadow-md hover:bg-destructive/90 transition-all disabled:opacity-40"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Applying Redactions...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Permanently Redact & Download PDF</span>
                  </>
                )}
              </button>
            </div>

            {/* Right: Interactive Canvas Drawing */}
            <div className="lg:col-span-7 space-y-2">
              <span className="text-xs text-muted-foreground font-semibold">
                Click & drag mouse across the document to blackout confidential sections
              </span>

              <div className="relative rounded-2xl border border-border bg-black/10 dark:bg-black/40 p-4 flex items-center justify-center min-h-[480px] overflow-hidden shadow-inner select-none">
                {currentThumb ? (
                  <div
                    ref={containerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className="relative max-h-[460px] aspect-[1/1.414] bg-white rounded-lg shadow-md border border-border overflow-hidden cursor-crosshair"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentThumb.dataUrl}
                      alt={`Page ${selectedPage}`}
                      className="w-full h-full object-contain pointer-events-none"
                    />

                    {/* Active Dragging Rectangle */}
                    {activeRect && (
                      <div
                        style={{
                          left: `${activeRect.x}px`,
                          top: `${activeRect.y}px`,
                          width: `${activeRect.w}px`,
                          height: `${activeRect.h}px`,
                        }}
                        className="absolute bg-black/80 border border-red-500 pointer-events-none"
                      />
                    )}

                    {/* Stored Redaction Boxes for Current Page */}
                    {currentPageBoxes.map((box) => (
                      <div
                        key={box.id}
                        style={{
                          left: `${box.xPct}%`,
                          top: `${box.yPct}%`,
                          width: `${box.widthPct}%`,
                          height: `${box.heightPct}%`,
                        }}
                        className="absolute bg-black pointer-events-none shadow-xs"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Rendering preview...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
