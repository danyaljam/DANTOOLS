"use client";

import * as React from "react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { toast } from "sonner";
import JSZip from "jszip";
import {
  Minimize2,
  Download,
  Loader2,
  Sliders,
  Sparkles,
  ArrowRight,
  Eye,
  FileCheck,
} from "lucide-react";
import { formatBytes, downloadBlob } from "@/lib/utils";

interface CompressedResult {
  file: File;
  originalSize: number;
  originalUrl: string;
  compressedBlob: Blob;
  compressedSize: number;
  compressedUrl: string;
  width: number;
  height: number;
  reductionPercentage: number;
}

export function ImageCompressor() {
  const [sourceFile, setSourceFile] = React.useState<File | null>(null);
  const [result, setResult] = React.useState<CompressedResult | null>(null);
  const [quality, setQuality] = React.useState<number>(80);
  const [targetFormat, setTargetFormat] = React.useState<"original" | "webp" | "jpeg" | "png">("webp");
  const [maxDimension, setMaxDimension] = React.useState<number>(0); // 0 = original
  const [isCompressing, setIsCompressing] = React.useState(false);

  // Split-slider position (0-100)
  const [sliderPosition, setSliderPosition] = React.useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleFileAdded = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setSourceFile(file);
    processCompression(file, quality, targetFormat, maxDimension);
  };

  const processCompression = async (
    file: File,
    q: number,
    format: "original" | "webp" | "jpeg" | "png",
    maxDim: number
  ) => {
    setIsCompressing(true);
    try {
      const originalUrl = URL.createObjectURL(file);
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = originalUrl;
      });

      let targetWidth = img.naturalWidth;
      let targetHeight = img.naturalHeight;

      if (maxDim > 0 && (targetWidth > maxDim || targetHeight > maxDim)) {
        if (targetWidth > targetHeight) {
          targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
          targetWidth = maxDim;
        } else {
          targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
          targetHeight = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize canvas");

      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      let mimeType = file.type;
      if (format === "webp") mimeType = "image/webp";
      else if (format === "jpeg") mimeType = "image/jpeg";
      else if (format === "png") mimeType = "image/png";

      const compressedBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Compression failed"));
          },
          mimeType,
          q / 100
        );
      });

      const compressedUrl = URL.createObjectURL(compressedBlob);
      const reduction = Math.max(
        0,
        Math.round(((file.size - compressedBlob.size) / file.size) * 100)
      );

      setResult({
        file,
        originalSize: file.size,
        originalUrl,
        compressedBlob,
        compressedSize: compressedBlob.size,
        compressedUrl,
        width: targetWidth,
        height: targetHeight,
        reductionPercentage: reduction,
      });

      toast.success(
        `Compressed! Size reduced by ${reduction}% (${formatBytes(file.size)} → ${formatBytes(
          compressedBlob.size
        )})`
      );
    } catch (err: any) {
      toast.error("Compression failed: " + err.message);
    } finally {
      setIsCompressing(false);
    }
  };

  // Re-run compression when settings change
  const handleQualityChange = (newQ: number) => {
    setQuality(newQ);
    if (sourceFile) {
      processCompression(sourceFile, newQ, targetFormat, maxDimension);
    }
  };

  const handleFormatChange = (newFormat: any) => {
    setTargetFormat(newFormat);
    if (sourceFile) {
      processCompression(sourceFile, quality, newFormat, maxDimension);
    }
  };

  const handleDimensionChange = (newDim: number) => {
    setMaxDimension(newDim);
    if (sourceFile) {
      processCompression(sourceFile, quality, targetFormat, newDim);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const ext =
      targetFormat === "webp"
        ? "webp"
        : targetFormat === "jpeg"
        ? "jpg"
        : targetFormat === "png"
        ? "png"
        : result.file.name.split(".").pop() || "jpg";

    const baseName = result.file.name.replace(/\.[^/.]+$/, "");
    downloadBlob(result.compressedBlob, `${baseName}_optimized.${ext}`);
    toast.success("Compressed image downloaded!");
  };

  const resetAll = () => {
    if (result) {
      URL.revokeObjectURL(result.originalUrl);
      URL.revokeObjectURL(result.compressedUrl);
    }
    setSourceFile(null);
    setResult(null);
  };

  // Split-slider dragging
  const handleMouseDown = () => setIsDraggingSlider(true);
  const handleMouseUp = () => setIsDraggingSlider(false);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSlider || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPosition((x / rect.width) * 100);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="Image & Graphics"
        title="Image Compressor & Converter"
        description="Shrink image file size locally using HTML5 canvas with interactive before/after split comparison."
        onReset={resetAll}
      />

      {!sourceFile ? (
        <FileDropzone
          onFilesSelected={handleFileAdded}
          accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
          maxFiles={1}
          title="Drop image to compress & optimize"
          subtitle="Supports JPG, PNG, and WebP. 100% processed directly inside your browser."
        />
      ) : (
        <div className="space-y-6">
          {/* File summary and reduction stats */}
          {result && (
            <div className="p-5 rounded-2xl border border-border bg-card grid grid-cols-2 sm:grid-cols-4 gap-4 shadow-xs">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Original Size</span>
                <p className="text-base font-bold text-foreground">
                  {formatBytes(result.originalSize)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Optimized Size</span>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {formatBytes(result.compressedSize)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Space Saved</span>
                <p className="text-base font-bold text-primary">
                  {result.reductionPercentage > 0 ? `-${result.reductionPercentage}%` : "No change"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Resolution</span>
                <p className="text-base font-bold text-foreground">
                  {result.width} × {result.height}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Controls */}
            <div className="lg:col-span-5 space-y-5">
              <div className="p-5 rounded-2xl border border-border bg-card space-y-5 shadow-xs">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  <span>Compression Settings</span>
                </h3>

                {/* Quality Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-foreground">Quality</span>
                    <span className="text-primary font-mono font-bold">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={quality}
                    onChange={(e) => handleQualityChange(parseInt(e.target.value, 10))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Smallest Size (10%)</span>
                    <span>Balanced (80%)</span>
                    <span>Highest Quality (100%)</span>
                  </div>
                </div>

                {/* Format Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground block">
                    Output Format
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "webp", label: "WebP (Recommended)" },
                      { id: "jpeg", label: "JPEG" },
                      { id: "png", label: "PNG" },
                      { id: "original", label: "Keep Original" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handleFormatChange(f.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                          targetFormat === f.id
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border bg-background hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Dimension Resize */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground block">
                    Maximum Dimension
                  </label>
                  <select
                    value={maxDimension}
                    onChange={(e) => handleDimensionChange(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:ring-1 focus:ring-primary"
                  >
                    <option value="0">Original Resolution (No Resize)</option>
                    <option value="1920">1920px (Full HD)</option>
                    <option value="1280">1280px (Web standard)</option>
                    <option value="800">800px (Thumbnail / Blog)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={downloadResult}
                  disabled={!result || isCompressing}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {isCompressing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Optimizing Image...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download Optimized Image</span>
                    </>
                  )}
                </button>

                <button
                  onClick={resetAll}
                  className="w-full py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  Choose Another Image
                </button>
              </div>
            </div>

            {/* Right Column: Visual Split Comparison */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-primary" /> Visual Before / After Split
                </span>
                <span>Drag vertical divider to compare</span>
              </div>

              {result && (
                <div
                  ref={containerRef}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                  className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-border bg-black/5 dark:bg-black/40 shadow-inner select-none cursor-ew-resize flex items-center justify-center"
                >
                  {/* Compressed layer (underneath / right) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.compressedUrl}
                    alt="Compressed"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  />

                  {/* Original layer (clipped / left) */}
                  <div
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={result.originalUrl}
                      alt="Original"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />
                  </div>

                  {/* Split Divider line */}
                  <div
                    style={{ left: `${sliderPosition}%` }}
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-xl pointer-events-none"
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white text-slate-800 shadow-md flex items-center justify-center text-[10px] font-bold">
                      ↔
                    </div>
                  </div>

                  {/* Labels */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/70 text-white text-[11px] font-semibold backdrop-blur-xs pointer-events-none">
                    Original ({formatBytes(result.originalSize)})
                  </span>
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-[11px] font-semibold shadow-md pointer-events-none">
                    Optimized ({formatBytes(result.compressedSize)})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

