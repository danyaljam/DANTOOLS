"use client";

import * as React from "react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { toast } from "sonner";
import {
  EyeOff,
  Paintbrush,
  Square,
  Undo2,
  Redo2,
  Download,
  RotateCcw,
  Sliders,
  ShieldCheck,
} from "lucide-react";
import { downloadBlob } from "@/lib/utils";

type ToolMode = "brush" | "box" | "censor";

export function ImageBlur() {
  const [file, setFile] = React.useState<File | null>(null);
  const [imgElement, setImgElement] = React.useState<HTMLImageElement | null>(null);
  const [toolMode, setToolMode] = React.useState<ToolMode>("brush");
  const [effectType, setEffectType] = React.useState<"blur" | "pixelate" | "blackout">("blur");
  const [brushSize, setBrushSize] = React.useState<number>(30);
  const [blurIntensity, setBlurIntensity] = React.useState<number>(12);

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const isDrawing = React.useRef(false);
  const startPos = React.useRef({ x: 0, y: 0 });

  // Undo/Redo history
  const [history, setHistory] = React.useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState<number>(-1);

  const handleFileAdded = (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);

    const img = new Image();
    img.onload = () => {
      setImgElement(img);
      setTimeout(() => initCanvas(img), 50);
      toast.success(`Loaded ${selected.name}`);
    };
    img.src = URL.createObjectURL(selected);
  };

  const initCanvas = (img: HTMLImageElement) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);
    const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initialData]);
    setHistoryIndex(0);
  };

  const saveToHistory = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const currentData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex <= 0 || !canvasRef.current) return;
    const targetIdx = historyIndex - 1;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(history[targetIdx], 0, 0);
    setHistoryIndex(targetIdx);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1 || !canvasRef.current) return;
    const targetIdx = historyIndex + 1;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(history[targetIdx], 0, 0);
    setHistoryIndex(targetIdx);
  };

  // Canvas coordinates
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const applyPixelateOrBlurToRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    if (w <= 0 || h <= 0) return;

    if (effectType === "blackout") {
      ctx.fillStyle = "#000000";
      ctx.fillRect(x, y, w, h);
      return;
    }

    if (effectType === "pixelate") {
      const pixelSize = Math.max(8, Math.round(blurIntensity * 1.5));
      const imgData = ctx.getImageData(x, y, w, h);
      const data = imgData.data;

      for (let py = 0; py < h; py += pixelSize) {
        for (let px = 0; px < w; px += pixelSize) {
          const redIdx = (py * w + px) * 4;
          const r = data[redIdx];
          const g = data[redIdx + 1];
          const b = data[redIdx + 2];
          const a = data[redIdx + 3];

          for (let dy = 0; dy < pixelSize && py + dy < h; dy++) {
            for (let dx = 0; dx < pixelSize && px + dx < w; dx++) {
              const target = ((py + dy) * w + (px + dx)) * 4;
              data[target] = r;
              data[target + 1] = g;
              data[target + 2] = b;
              data[target + 3] = a;
            }
          }
        }
      }
      ctx.putImageData(imgData, x, y);
    } else {
      // Gaussian blur via downscale & upscale
      const tempCanvas = document.createElement("canvas");
      const factor = Math.max(4, Math.round(blurIntensity));
      tempCanvas.width = Math.max(1, Math.round(w / factor));
      tempCanvas.height = Math.max(1, Math.round(h / factor));
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      tempCtx.imageSmoothingQuality = "medium";
      tempCtx.drawImage(canvasRef.current!, x, y, w, h, 0, 0, tempCanvas.width, tempCanvas.height);

      ctx.save();
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, x, y, w, h);
      ctx.restore();
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const coords = getCanvasCoords(e);
    startPos.current = coords;

    if (toolMode === "brush") {
      handleMouseMove(e);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const coords = getCanvasCoords(e);

    if (toolMode === "brush") {
      const r = brushSize;
      const x = Math.max(0, coords.x - r / 2);
      const y = Math.max(0, coords.y - r / 2);
      applyPixelateOrBlurToRect(ctx, x, y, r, r);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !canvasRef.current) return;
    isDrawing.current = false;
    const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    if (toolMode === "box" || toolMode === "censor") {
      const coords = getCanvasCoords(e);
      const x = Math.min(startPos.current.x, coords.x);
      const y = Math.min(startPos.current.y, coords.y);
      const w = Math.abs(coords.x - startPos.current.x);
      const h = Math.abs(coords.y - startPos.current.y);

      if (w > 4 && h > 4) {
        if (toolMode === "censor") {
          ctx.fillStyle = "#000000";
          ctx.fillRect(x, y, w, h);
        } else {
          applyPixelateOrBlurToRect(ctx, x, y, w, h);
        }
      }
    }

    saveToHistory();
  };

  const downloadSanitized = () => {
    if (!canvasRef.current || !file) return;
    canvasRef.current.toBlob(
      (blob) => {
        if (!blob) return;
        downloadBlob(blob, `redacted_${file.name}`);
        toast.success("Redacted & blurred image downloaded!");
      },
      file.type === "image/png" ? "image/png" : "image/jpeg",
      0.95
    );
  };

  const resetAll = () => {
    setFile(null);
    setImgElement(null);
    setHistory([]);
    setHistoryIndex(-1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="Image & Graphics"
        title="Image Privacy Blur & Mask"
        description="Freehand brush blur, pixelation, and blackout censor boxes to redact sensitive data, faces, and IDs before sharing."
        onReset={resetAll}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileAdded}
          accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
          maxFiles={1}
          title="Upload image to blur or redact"
          subtitle="Manually brush or box-blur credit cards, faces, addresses, and license plates."
        />
      ) : (
        <div className="space-y-6">
          {/* Main Controls Header */}
          <div className="p-4 rounded-2xl border border-border bg-card flex flex-wrap items-center justify-between gap-4 shadow-xs">
            {/* Mode selection */}
            <div className="flex items-center gap-2">
              {[
                { id: "brush", label: "Blur Brush", icon: Paintbrush },
                { id: "box", label: "Redaction Box", icon: Square },
                { id: "censor", label: "Blackout Bar", icon: EyeOff },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = toolMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setToolMode(m.id as ToolMode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Effect style (Blur vs Pixelate) */}
            {toolMode !== "censor" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Effect:</span>
                <div className="flex rounded-lg border border-border bg-muted p-0.5">
                  <button
                    onClick={() => setEffectType("blur")}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      effectType === "blur"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Blur
                  </button>
                  <button
                    onClick={() => setEffectType("pixelate")}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      effectType === "pixelate"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Pixelate
                  </button>
                </div>
              </div>
            )}

            {/* Brush Size / Intensity Sliders */}
            {toolMode === "brush" && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground font-semibold">Brush:</span>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                    className="w-24 accent-primary"
                  />
                  <span className="font-mono text-muted-foreground">{brushSize}px</span>
                </div>
              </div>
            )}

            {/* Undo / Redo */}
            <div className="flex items-center gap-1">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
                title="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Canvas Canvas Area */}
          <div className="relative rounded-2xl border border-border bg-black/10 dark:bg-black/40 p-4 flex items-center justify-center min-h-[500px] overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="max-h-[550px] max-w-full object-contain cursor-crosshair rounded-xl shadow-lg"
            />
          </div>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Zero server upload — pixel redactions happen entirely in local memory.</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={resetAll}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                Change Image
              </button>

              <button
                onClick={downloadSanitized}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-md hover:bg-primary/90 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Redacted Image</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

