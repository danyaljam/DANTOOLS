"use client";

import * as React from "react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { toast } from "sonner";
import {
  Stamp,
  Download,
  Loader2,
  Sliders,
  Type,
  Hash,
  Eye,
  FileCheck,
} from "lucide-react";
import { formatBytes, downloadBlob } from "@/lib/utils";
import { renderPdfThumbnails, RenderedPageInfo } from "@/lib/pdf-helpers";

export function PdfWatermark() {
  const [file, setFile] = React.useState<File | null>(null);
  const [firstPageThumb, setFirstPageThumb] = React.useState<RenderedPageInfo | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  // Watermark settings
  const [enableWatermark, setEnableWatermark] = React.useState(true);
  const [watermarkText, setWatermarkText] = React.useState("CONFIDENTIAL");
  const [watermarkFontSize, setWatermarkFontSize] = React.useState(48);
  const [watermarkOpacity, setWatermarkOpacity] = React.useState(0.25);
  const [watermarkAngle, setWatermarkAngle] = React.useState(-45);
  const [watermarkColor, setWatermarkColor] = React.useState("#ef4444"); // red

  // Page numbering settings
  const [enablePageNumbers, setEnablePageNumbers] = React.useState(true);
  const [pageNumberFormat, setPageNumberFormat] = React.useState<"page_of_total" | "slash" | "number_only">("page_of_total");
  const [pageNumberPosition, setPageNumberPosition] = React.useState<"bottom_center" | "bottom_right" | "top_right">("bottom_center");
  const [pageNumberFontSize, setPageNumberFontSize] = React.useState(10);

  const handleFileAdded = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const count = pdf.getPageCount();
      setPageCount(count);

      const thumbs = await renderPdfThumbnails(selectedFile, 1, 0.6);
      if (thumbs.length > 0) {
        setFirstPageThumb(thumbs[0]);
      }
      toast.success(`Loaded ${count} pages from ${selectedFile.name}`);
    } catch (err: any) {
      toast.error("Failed to load PDF: " + err.message);
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Convert hex color to rgb [0-1]
  const hexToRgb = (hex: string) => {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return { r: isNaN(r) ? 0.5 : r, g: isNaN(g) ? 0.5 : g, b: isNaN(b) ? 0.5 : b };
  };

  const applyAndDownload = async () => {
    if (!file) return;
    setIsExporting(true);

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer);
      const helvetica = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helveticaRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const pages = pdfDoc.getPages();
      const total = pages.length;
      const { r, g, b } = hexToRgb(watermarkColor);

      pages.forEach((page, index) => {
        const { width, height } = page.getSize();
        const pageNum = index + 1;

        // Overlay watermark
        if (enableWatermark && watermarkText.trim()) {
          const textWidth = helvetica.widthOfTextAtSize(watermarkText, watermarkFontSize);
          const textHeight = helvetica.heightAtSize(watermarkFontSize);

          // Calculate approximate center with rotation
          const centerX = width / 2;
          const centerY = height / 2;

          page.drawText(watermarkText, {
            x: centerX - (textWidth / 2) * Math.cos((watermarkAngle * Math.PI) / 180),
            y: centerY - (textWidth / 2) * Math.sin((watermarkAngle * Math.PI) / 180),
            size: watermarkFontSize,
            font: helvetica,
            color: rgb(r, g, b),
            opacity: watermarkOpacity,
            rotate: degrees(watermarkAngle),
          });
        }

        // Overlay page numbers
        if (enablePageNumbers) {
          let label = `Page ${pageNum} of ${total}`;
          if (pageNumberFormat === "slash") {
            label = `${pageNum} / ${total}`;
          } else if (pageNumberFormat === "number_only") {
            label = `${pageNum}`;
          }

          const labelWidth = helveticaRegular.widthOfTextAtSize(label, pageNumberFontSize);
          let posX = width / 2 - labelWidth / 2;
          let posY = 24;

          if (pageNumberPosition === "bottom_right") {
            posX = width - labelWidth - 36;
            posY = 24;
          } else if (pageNumberPosition === "top_right") {
            posX = width - labelWidth - 36;
            posY = height - 28;
          }

          page.drawText(label, {
            x: posX,
            y: posY,
            size: pageNumberFontSize,
            font: helveticaRegular,
            color: rgb(0.3, 0.3, 0.3),
            opacity: 0.85,
          });
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      downloadBlob(blob, `watermarked_${file.name}`);
      toast.success("Document watermarked and downloaded successfully!");
    } catch (err: any) {
      toast.error("Failed to watermark PDF: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setFirstPageThumb(null);
    setPageCount(0);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="PDF Utilities"
        title="PDF Watermark & Page Numbers"
        description="Overlay customizable diagonal or horizontal text watermarks and stamp page numbering ('Page X of Y')."
        onReset={resetAll}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileAdded}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          title="Upload a PDF to watermark or number"
          subtitle="Add text branding, confidential stamps, or pagination. Processed 100% in your browser."
        />
      ) : (
        <div className="space-y-6">
          {/* File details bar */}
          <div className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Stamp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">{file.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} • {pageCount} page(s)
                </p>
              </div>
            </div>

            <button
              onClick={resetAll}
              className="px-3 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 text-xs font-medium"
            >
              Change PDF
            </button>
          </div>

          {/* Main 2-column layout: Settings on left, Preview on right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Settings Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Section 1: Watermark Settings */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Type className="w-4 h-4 text-primary" />
                    <span>Text Watermark</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableWatermark}
                      onChange={(e) => setEnableWatermark(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {enableWatermark && (
                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                        Watermark Text
                      </label>
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        placeholder="e.g. CONFIDENTIAL, DRAFT, DO NOT COPY"
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-1.5">
                          <span>Opacity</span>
                          <span>{Math.round(watermarkOpacity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="0.9"
                          step="0.05"
                          value={watermarkOpacity}
                          onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                          className="w-full accent-primary"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-1.5">
                          <span>Font Size</span>
                          <span>{watermarkFontSize}pt</span>
                        </div>
                        <input
                          type="range"
                          min="16"
                          max="90"
                          step="2"
                          value={watermarkFontSize}
                          onChange={(e) => setWatermarkFontSize(parseInt(e.target.value, 10))}
                          className="w-full accent-primary"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-1.5">
                          <span>Rotation Angle</span>
                          <span>{watermarkAngle}°</span>
                        </div>
                        <input
                          type="range"
                          min="-90"
                          max="90"
                          step="5"
                          value={watermarkAngle}
                          onChange={(e) => setWatermarkAngle(parseInt(e.target.value, 10))}
                          className="w-full accent-primary"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                          Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={watermarkColor}
                            onChange={(e) => setWatermarkColor(e.target.value)}
                            className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-transparent"
                          />
                          <div className="flex items-center gap-1.5">
                            {["#ef4444", "#64748b", "#3b82f6", "#000000"].map((c) => (
                              <button
                                key={c}
                                onClick={() => setWatermarkColor(c)}
                                style={{ backgroundColor: c }}
                                className="w-6 h-6 rounded-full border border-border/60 hover:scale-110 transition-transform"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Page Numbers */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Hash className="w-4 h-4 text-emerald-500" />
                    <span>Page Numbers</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enablePageNumbers}
                      onChange={(e) => setEnablePageNumbers(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {enablePageNumbers && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                        Numbering Format
                      </label>
                      <select
                        value={pageNumberFormat}
                        onChange={(e) => setPageNumberFormat(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="page_of_total">Page 1 of {pageCount || "N"}</option>
                        <option value="slash">1 / {pageCount || "N"}</option>
                        <option value="number_only">1 (Number only)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                        Position
                      </label>
                      <select
                        value={pageNumberPosition}
                        onChange={(e) => setPageNumberPosition(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="bottom_center">Bottom Center</option>
                        <option value="bottom_right">Bottom Right</option>
                        <option value="top_right">Top Right</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-2">
                <button
                  onClick={applyAndDownload}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing & Exporting PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Apply & Download Stamped PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Visual Preview Column */}
            <div className="lg:col-span-5 flex flex-col space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> Live Visual Mockup
                </span>
                <span>First page preview</span>
              </div>

              <div className="relative rounded-2xl border border-border bg-card p-4 flex items-center justify-center min-h-[420px] shadow-inner overflow-hidden">
                {firstPageThumb ? (
                  <div className="relative w-full max-w-[280px] aspect-[1/1.414] bg-white rounded-lg shadow-lg overflow-hidden border border-border/80 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={firstPageThumb.dataUrl}
                      alt="First page preview"
                      className="w-full h-full object-contain pointer-events-none select-none opacity-85"
                    />

                    {/* Simulated Watermark overlay */}
                    {enableWatermark && watermarkText && (
                      <div
                        style={{
                          transform: `rotate(${watermarkAngle}deg)`,
                          color: watermarkColor,
                          opacity: watermarkOpacity,
                          fontSize: `${watermarkFontSize * 0.4}px`,
                        }}
                        className="absolute font-black tracking-widest pointer-events-none select-none text-center whitespace-nowrap"
                      >
                        {watermarkText}
                      </div>
                    )}

                    {/* Simulated Page Number overlay */}
                    {enablePageNumbers && (
                      <div
                        className={`absolute text-[10px] font-sans text-slate-700 pointer-events-none select-none ${
                          pageNumberPosition === "bottom_center"
                            ? "bottom-2.5 left-1/2 -translate-x-1/2"
                            : pageNumberPosition === "bottom_right"
                            ? "bottom-2.5 right-3"
                            : "top-2.5 right-3"
                        }`}
                      >
                        {pageNumberFormat === "page_of_total"
                          ? `Page 1 of ${pageCount || 1}`
                          : pageNumberFormat === "slash"
                          ? `1 / ${pageCount || 1}`
                          : `1`}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Loading preview...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
