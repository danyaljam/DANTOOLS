"use client";

import * as React from "react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { toast } from "sonner";
import {
  Crop,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  FileCheck,
  Sparkles,
} from "lucide-react";
import { downloadBlob } from "@/lib/utils";

interface SocialPreset {
  id: string;
  name: string;
  platform: string;
  width: number;
  height: number;
  aspectRatio: string;
}

const PRESETS: SocialPreset[] = [
  { id: "yt-thumb", name: "YouTube Thumbnail", platform: "YouTube", width: 1280, height: 720, aspectRatio: "16:9" },
  { id: "ig-sq", name: "Instagram Post (Square)", platform: "Instagram", width: 1080, height: 1080, aspectRatio: "1:1" },
  { id: "ig-story", name: "Instagram Story / Reels", platform: "Instagram", width: 1080, height: 1920, aspectRatio: "9:16" },
  { id: "tw-header", name: "Twitter / X Header", platform: "Twitter", width: 1500, height: 500, aspectRatio: "3:1" },
  { id: "tw-post", name: "Twitter / X Post", platform: "Twitter", width: 1200, height: 675, aspectRatio: "16:9" },
  { id: "li-banner", name: "LinkedIn Banner", platform: "LinkedIn", width: 1584, height: 396, aspectRatio: "4:1" },
  { id: "fb-cover", name: "Facebook Cover", platform: "Facebook", width: 820, height: 312, aspectRatio: "2.6:1" },
];

export function SocialResizer() {
  const [file, setFile] = React.useState<File | null>(null);
  const [imgElement, setImgElement] = React.useState<HTMLImageElement | null>(null);
  const [activePreset, setActivePreset] = React.useState<SocialPreset>(PRESETS[0]);
  const [zoom, setZoom] = React.useState<number>(1);
  const [panX, setPanX] = React.useState<number>(0);
  const [panY, setPanY] = React.useState<number>(0);
  const [bgMode, setBgMode] = React.useState<"fit_blur" | "black" | "white">("fit_blur");
  const [exportFormat, setExportFormat] = React.useState<"png" | "jpeg">("png");

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const isDragging = React.useRef(false);
  const startDragPos = React.useRef({ x: 0, y: 0 });

  const handleFileAdded = (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    const img = new Image();
    img.onload = () => {
      setImgElement(img);
      setZoom(1);
      setPanX(0);
      setPanY(0);
      toast.success(`Loaded ${selected.name} (${img.naturalWidth}x${img.naturalHeight})`);
    };
    img.src = URL.createObjectURL(selected);
  };

  // Redraw canvas whenever preset, zoom, pan, or bg changes
  React.useEffect(() => {
    if (!canvasRef.current || !imgElement) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = activePreset.width;
    canvas.height = activePreset.height;

    // Background fill
    if (bgMode === "black") {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (bgMode === "white") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (bgMode === "fit_blur") {
      // Draw blurred stretched image underneath
      ctx.save();
      ctx.filter = "blur(20px) brightness(0.6)";
      ctx.drawImage(imgElement, -20, -20, canvas.width + 40, canvas.height + 40);
      ctx.restore();
    }

    // Calculate image fitting with zoom and pan
    const imgRatio = imgElement.naturalWidth / imgElement.naturalHeight;
    const targetRatio = activePreset.width / activePreset.height;

    let baseWidth = activePreset.width;
    let baseHeight = activePreset.height;

    if (imgRatio > targetRatio) {
      baseWidth = activePreset.height * imgRatio;
      baseHeight = activePreset.height;
    } else {
      baseWidth = activePreset.width;
      baseHeight = activePreset.width / imgRatio;
    }

    const drawWidth = baseWidth * zoom;
    const drawHeight = baseHeight * zoom;

    const drawX = (activePreset.width - drawWidth) / 2 + panX;
    const drawY = (activePreset.height - drawHeight) / 2 + panY;

    ctx.drawImage(imgElement, drawX, drawY, drawWidth, drawHeight);
  }, [imgElement, activePreset, zoom, panX, panY, bgMode]);

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    startDragPos.current = { x: e.clientX - panX, y: e.clientY - panY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    setPanX(e.clientX - startDragPos.current.x);
    setPanY(e.clientY - startDragPos.current.y);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const exportCroppedImage = () => {
    if (!canvasRef.current || !file) return;
    const mime = exportFormat === "png" ? "image/png" : "image/jpeg";
    canvasRef.current.toBlob(
      (blob) => {
        if (!blob) return;
        downloadBlob(
          blob,
          `${file.name.replace(/\.[^/.]+$/, "")}_${activePreset.id}.${exportFormat}`
        );
        toast.success(`Exported ${activePreset.name} (${activePreset.width}x${activePreset.height})!`);
      },
      mime,
      0.95
    );
  };

  const resetAll = () => {
    setFile(null);
    setImgElement(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="Image & Graphics"
        title="Social Media Resizer & Cropper"
        description="Scale and crop photos for YouTube thumbnails, Instagram posts/stories, Twitter headers, and LinkedIn banners."
        onReset={resetAll}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileAdded}
          accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
          maxFiles={1}
          title="Upload image to crop for social media"
          subtitle="Instant aspect-ratio presets with interactive drag & zoom canvas."
        />
      ) : (
        <div className="space-y-6">
          {/* Preset Selector Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => {
              const isSelected = activePreset.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setActivePreset(p);
                    setPanX(0);
                    setPanY(0);
                    setZoom(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <span>{p.name}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                      isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.aspectRatio}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Canvas preview */}
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Move className="w-4 h-4 text-primary" /> Drag to reposition • Zoom to fit
                </span>
                <span className="font-mono">
                  {activePreset.width} × {activePreset.height} px
                </span>
              </div>

              <div className="relative rounded-2xl border border-border bg-black/5 dark:bg-black/50 p-4 flex items-center justify-center min-h-[460px] overflow-hidden shadow-inner">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="max-h-[420px] max-w-full object-contain cursor-grab active:cursor-grabbing rounded-xl shadow-lg"
                />
              </div>
            </div>

            {/* Right: Controls & Adjustments */}
            <div className="lg:col-span-4 space-y-5">
              <div className="p-5 rounded-2xl border border-border bg-card space-y-5 shadow-xs">
                <h3 className="text-sm font-bold text-foreground">Canvas Controls</h3>

                {/* Zoom */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Zoom Scale</span>
                    <span className="text-primary font-mono">{zoom.toFixed(2)}x</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </div>

                {/* Background mode */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground block">
                    Border / Letterbox Fill
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "fit_blur", label: "Blurred" },
                      { id: "black", label: "Black" },
                      { id: "white", label: "White" },
                    ].map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setBgMode(b.id as any)}
                        className={`py-1.5 text-xs font-medium rounded-lg border text-center transition-all ${
                          bgMode === b.id
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border bg-background hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export Format */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground block">
                    Export Format
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["png", "jpeg"].map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setExportFormat(fmt as any)}
                        className={`py-1.5 text-xs font-medium rounded-lg border uppercase text-center transition-all ${
                          exportFormat === fmt
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border bg-background hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset crop button */}
                <button
                  onClick={() => {
                    setZoom(1);
                    setPanX(0);
                    setPanY(0);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-medium text-muted-foreground"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Pan & Zoom</span>
                </button>
              </div>

              {/* Download button */}
              <button
                onClick={exportCroppedImage}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download {activePreset.name}</span>
              </button>

              <button
                onClick={resetAll}
                className="w-full py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                Change Source Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

