"use client";

import * as React from "react";
import { Camera, Download, Plus, Trash2, RefreshCw, Check, Loader2, Video, VideoOff } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { downloadBlob } from "@/lib/utils";

interface ScannedPage {
  id: string;
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
}

export function PdfScan() {
  const [streamActive, setStreamActive] = React.useState(false);
  const [filterMode, setFilterMode] = React.useState<"color" | "grayscale" | "contrast">("contrast");
  const [scannedPages, setScannedPages] = React.useState<ScannedPage[]>([]);
  const [isExporting, setIsExporting] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreamActive(true);
      toast.success("Camera started. Align your document and capture pages.");
    } catch (err: any) {
      toast.error(`Camera permission denied or unavailable: ${err.message}`);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  };

  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const capturePage = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply document contrast / B&W filter
    if (filterMode === "grayscale" || filterMode === "contrast") {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (filterMode === "contrast") {
          const threshold = 135;
          const val = avg > threshold ? 255 : Math.max(0, avg * 0.7);
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
        } else {
          data[i] = avg;
          data[i + 1] = avg;
          data[i + 2] = avg;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setScannedPages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          dataUrl,
          blob,
          width: canvas.width,
          height: canvas.height,
        },
      ]);
      toast.success(`Captured Page ${scannedPages.length + 1}!`);
    }, "image/jpeg", 0.9);
  };

  const removePage = (id: string) => {
    setScannedPages((prev) => prev.filter((p) => p.id !== id));
  };

  const exportPdf = async () => {
    if (scannedPages.length === 0) return;
    setIsExporting(true);
    try {
      const pdfDoc = await PDFDocument.create();
      for (const page of scannedPages) {
        const buffer = await page.blob.arrayBuffer();
        const img = await pdfDoc.embedJpg(buffer);
        const pdfPage = pdfDoc.addPage([img.width, img.height]);
        pdfPage.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      downloadBlob(blob, `scanned_doc_${Date.now()}.pdf`);
      toast.success("Scanned document downloaded as PDF!");
    } catch (err: any) {
      toast.error(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const reset = () => {
    stopCamera();
    setScannedPages([]);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="PDF Utilities"
        title="Scan to PDF"
        description="Capture paper documents, receipts, and notes using your device camera, apply clean filters, and export to PDF."
        onReset={reset}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Camera & Viewfinder */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Camera Scanner
              </span>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Filter:</span>
                {(["contrast", "grayscale", "color"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setFilterMode(m)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md uppercase transition-all ${
                      filterMode === m
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "contrast" ? "Document B&W" : m}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black flex items-center justify-center border border-border">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${!streamActive ? "hidden" : ""}`}
              />
              {!streamActive && (
                <div className="text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-muted/40 text-muted-foreground mx-auto flex items-center justify-center">
                    <Camera className="w-7 h-7" />
                  </div>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Camera is off. Click below to start scanning documents directly.
                  </p>
                  <button
                    onClick={startCamera}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/90 transition-all"
                  >
                    <Video className="w-4 h-4" /> Start Camera
                  </button>
                </div>
              )}
            </div>

            {streamActive && (
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={stopCamera}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted"
                >
                  <VideoOff className="w-4 h-4" /> Stop Camera
                </button>

                <button
                  onClick={capturePage}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
                >
                  <Camera className="w-5 h-5" /> Snap Page ({scannedPages.length + 1})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Captured Pages Queue */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                Captured Pages ({scannedPages.length})
              </h3>
              {scannedPages.length > 0 && (
                <button
                  onClick={() => setScannedPages([])}
                  className="text-xs text-destructive hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {scannedPages.length === 0 ? (
              <div className="p-12 text-center rounded-xl border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
                No pages snapped yet. Point your camera at a page and click "Snap Page".
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[380px] overflow-y-auto">
                {scannedPages.map((page, idx) => (
                  <div
                    key={page.id}
                    className="group relative rounded-xl border border-border bg-muted/30 p-2 flex flex-col items-center space-y-2"
                  >
                    <div className="relative w-full aspect-[3/4] bg-white rounded-lg overflow-hidden border border-border flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={page.dataUrl}
                        alt={`Scanned page ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                      <span className="absolute top-1 left-1 bg-black/70 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                    </div>

                    <button
                      onClick={() => removePage(page.id)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={exportPdf}
              disabled={isExporting || scannedPages.length === 0}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all disabled:opacity-40"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Scanned PDF ({scannedPages.length} pages)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
