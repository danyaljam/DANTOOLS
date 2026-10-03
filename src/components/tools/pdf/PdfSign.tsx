"use client";

import * as React from "react";
import { PenTool, Download, RotateCcw, Check, Loader2, Type, Image as ImageIcon } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { renderPdfThumbnails, RenderedPageInfo } from "@/lib/pdf-helpers";
import { downloadBlob, formatBytes } from "@/lib/utils";

export function PdfSign() {
  const [file, setFile] = React.useState<File | null>(null);
  const [thumbnails, setThumbnails] = React.useState<RenderedPageInfo[]>([]);
  const [selectedPage, setSelectedPage] = React.useState<number>(1);
  const [signMode, setSignMode] = React.useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = React.useState("Danyal Jamil");
  const [signatureDataUrl, setSignatureDataUrl] = React.useState<string | null>(null);
  const [sigPosition, setSigPosition] = React.useState<{ x: number; y: number }>({ x: 50, y: 70 }); // in percentages
  const [isSigning, setIsSigning] = React.useState(false);

  const drawCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const isDrawing = React.useRef(false);

  const handleFileAdded = async (files: File[]) => {
    const selected = files[0];
    if (!selected) return;
    setFile(selected);
    try {
      const thumbs = await renderPdfThumbnails(selected, 30, 0.5);
      setThumbnails(thumbs);
      setSelectedPage(1);
      toast.success(`Loaded ${selected.name}`);
    } catch (err: any) {
      toast.error(`Could not read PDF: ${err.message}`);
      setFile(null);
    }
  };

  // Drawing canvas logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    if (drawCanvasRef.current) {
      setSignatureDataUrl(drawCanvasRef.current.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    if (drawCanvasRef.current) {
      const ctx = drawCanvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);
      setSignatureDataUrl(null);
    }
  };

  // Generate typed signature dataUrl
  React.useEffect(() => {
    if (signMode === "type") {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 120;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.font = "italic 36px 'Brush Script MT', cursive, sans-serif";
        ctx.fillStyle = "#1e293b";
        ctx.fillText(typedName, 20, 70);
        setSignatureDataUrl(canvas.toDataURL("image/png"));
      }
    }
  }, [signMode, typedName]);

  // Click on page preview to place signature
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setSigPosition({ x: xPct, y: yPct });
    toast.info(`Signature target set at ${xPct}%, ${yPct}%`);
  };

  const executeSign = async () => {
    if (!file || !signatureDataUrl) {
      toast.warning("Please create your signature first.");
      return;
    }

    setIsSigning(true);
    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      const pages = pdfDoc.getPages();
      const pageIndex = Math.max(0, Math.min(selectedPage - 1, pages.length - 1));
      const targetPdfPage = pages[pageIndex];

      const sigResponse = await fetch(signatureDataUrl);
      const sigBytes = await sigResponse.arrayBuffer();
      const embeddedSig = await pdfDoc.embedPng(sigBytes);

      const { width: pWidth, height: pHeight } = targetPdfPage.getSize();
      const sigWidth = 140;
      const sigHeight = (sigWidth / embeddedSig.width) * embeddedSig.height;

      // Position (PDF Y coordinate is bottom-to-top)
      const posX = (sigPosition.x / 100) * pWidth - sigWidth / 2;
      const posY = pHeight - (sigPosition.y / 100) * pHeight - sigHeight / 2;

      targetPdfPage.drawImage(embeddedSig, {
        x: Math.max(0, posX),
        y: Math.max(0, posY),
        width: sigWidth,
        height: sigHeight,
      });

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      downloadBlob(blob, `signed_${file.name}`);
      toast.success("Signed PDF downloaded successfully!");
    } catch (err: any) {
      toast.error(`Signing failed: ${err.message}`);
    } finally {
      setIsSigning(false);
    }
  };

  const reset = () => {
    setFile(null);
    setThumbnails([]);
    clearCanvas();
  };

  const currentThumb = thumbnails.find((t) => t.pageNumber === selectedPage) || thumbnails[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="PDF Utilities"
        title="Sign PDF"
        description="Create your digital signature, place it on any page, and download the signed PDF legally and locally."
        onReset={reset}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileAdded}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          title="Upload PDF to sign"
          subtitle="Draw or type your signature and position it on any page."
        />
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <PenTool className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">{file.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} • Page {selectedPage} of {thumbnails.length}
                </p>
              </div>
            </div>

            <button
              onClick={reset}
              className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border"
            >
              Change File
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Signature Creation Pad */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Signature Style
                  </span>
                  <div className="flex rounded-lg border border-border bg-muted p-0.5">
                    <button
                      onClick={() => setSignMode("draw")}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        signMode === "draw"
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground"
                      }`}
                    >
                      Draw
                    </button>
                    <button
                      onClick={() => setSignMode("type")}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        signMode === "type"
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground"
                      }`}
                    >
                      Type
                    </button>
                  </div>
                </div>

                {signMode === "draw" ? (
                  <div className="space-y-2">
                    <div className="border border-border rounded-xl bg-white overflow-hidden shadow-inner">
                      <canvas
                        ref={drawCanvasRef}
                        width={380}
                        height={140}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        className="w-full h-[140px] cursor-crosshair"
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Sign with mouse or touch</span>
                      <button
                        onClick={clearCanvas}
                        className="text-xs text-destructive hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      placeholder="Type your full name..."
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary"
                    />
                    <div className="p-4 rounded-xl border border-border bg-white text-center font-serif italic text-2xl text-slate-800">
                      {typedName || "Your Signature"}
                    </div>
                  </div>
                )}

                {/* Page Selector */}
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <label className="text-xs font-semibold text-muted-foreground block">
                    Page to Sign
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
              </div>

              <button
                onClick={executeSign}
                disabled={isSigning || !signatureDataUrl}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all disabled:opacity-40"
              >
                {isSigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Stamping Signature...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Apply Signature & Download PDF</span>
                  </>
                )}
              </button>
            </div>

            {/* Right: Interactive Page Canvas Placement */}
            <div className="lg:col-span-7 space-y-2">
              <span className="text-xs text-muted-foreground font-semibold">
                Click anywhere on the page to reposition your signature
              </span>

              <div
                onClick={handlePageClick}
                className="relative rounded-2xl border border-border bg-black/10 dark:bg-black/40 p-4 flex items-center justify-center min-h-[480px] cursor-crosshair overflow-hidden shadow-inner select-none"
              >
                {currentThumb ? (
                  <div className="relative max-h-[460px] aspect-[1/1.414] bg-white rounded-lg shadow-md border border-border overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentThumb.dataUrl}
                      alt={`Page ${selectedPage}`}
                      className="w-full h-full object-contain pointer-events-none"
                    />

                    {/* Signature Placement Indicator */}
                    {signatureDataUrl && (
                      <div
                        style={{
                          left: `${sigPosition.x}%`,
                          top: `${sigPosition.y}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                        className="absolute p-1 border-2 border-primary border-dashed bg-primary/10 rounded shadow-md pointer-events-none max-w-[140px]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={signatureDataUrl}
                          alt="Signature Preview"
                          className="w-full h-auto"
                        />
                      </div>
                    )}
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
