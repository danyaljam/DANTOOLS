"use client";

import * as React from "react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { PDFDocument, PageSizes } from "pdf-lib";
import JSZip from "jszip";
import { toast } from "sonner";
import {
  FileImage,
  ArrowLeftRight,
  Download,
  Loader2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  FileCheck,
} from "lucide-react";
import { formatBytes, downloadBlob } from "@/lib/utils";
import { getPdfJs } from "@/lib/pdf-helpers";

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

export function ImagePdfConverter() {
  const [activeTab, setActiveTab] = React.useState<"img2pdf" | "pdf2img">("img2pdf");

  // Mode 1: Images to PDF
  const [images, setImages] = React.useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = React.useState<"fit" | "a4" | "letter">("fit");
  const [pageMargin, setPageMargin] = React.useState<number>(10);
  const [isConvertingImgToPdf, setIsConvertingImgToPdf] = React.useState(false);

  // Mode 2: PDF to Images
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [exportFormat, setExportFormat] = React.useState<"png" | "jpeg">("png");
  const [exportScale, setExportScale] = React.useState<number>(1.5);
  const [pdfPageCount, setPdfPageCount] = React.useState<number>(0);
  const [isConvertingPdfToImg, setIsConvertingPdfToImg] = React.useState(false);

  // Handle Images Added
  const handleImagesAdded = async (files: File[]) => {
    const loaded: ImageItem[] = [];
    for (const file of files) {
      const previewUrl = URL.createObjectURL(file);
      const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({ width: 800, height: 600 });
        img.src = previewUrl;
      });

      loaded.push({
        id: Math.random().toString(36).substring(7),
        file,
        previewUrl,
        width: dimensions.width,
        height: dimensions.height,
      });
    }
    setImages((prev) => [...prev, ...loaded]);
    toast.success(`Added ${loaded.length} image(s)`);
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setImages(updated);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(images[index].previewUrl);
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const convertImagesToPdf = async () => {
    if (images.length === 0) return;
    setIsConvertingImgToPdf(true);
    try {
      const pdfDoc = await PDFDocument.create();

      for (const item of images) {
        const buffer = await item.file.arrayBuffer();
        let embeddedImage;

        if (item.file.type === "image/png") {
          embeddedImage = await pdfDoc.embedPng(buffer);
        } else {
          // For JPG / WebP / others, draw onto canvas first to get standard JPEG bytes if needed
          if (item.file.type === "image/jpeg" || item.file.type === "image/jpg") {
            try {
              embeddedImage = await pdfDoc.embedJpg(buffer);
            } catch {
              // fallback via canvas
              embeddedImage = await embedViaCanvas(pdfDoc, item.previewUrl);
            }
          } else {
            embeddedImage = await embedViaCanvas(pdfDoc, item.previewUrl);
          }
        }

        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;

        let pageWidth = imgWidth + pageMargin * 2;
        let pageHeight = imgHeight + pageMargin * 2;

        if (pageSize === "a4") {
          pageWidth = PageSizes.A4[0];
          pageHeight = PageSizes.A4[1];
        } else if (pageSize === "letter") {
          pageWidth = PageSizes.Letter[0];
          pageHeight = PageSizes.Letter[1];
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Scale image to fit within available page area
        const maxWidth = pageWidth - pageMargin * 2;
        const maxHeight = pageHeight - pageMargin * 2;
        const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight, 1);
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;

        const posX = (pageWidth - scaledWidth) / 2;
        const posY = (pageHeight - scaledHeight) / 2;

        page.drawImage(embeddedImage, {
          x: posX,
          y: posY,
          width: scaledWidth,
          height: scaledHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      downloadBlob(blob, `images_${Date.now()}.pdf`);
      toast.success("Images converted to PDF successfully!");
    } catch (err: any) {
      toast.error("Failed to convert images to PDF: " + err.message);
    } finally {
      setIsConvertingImgToPdf(false);
    }
  };

  const embedViaCanvas = async (pdfDoc: PDFDocument, src: string) => {
    return new Promise<any>((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        const response = await fetch(dataUrl);
        const buffer = await response.arrayBuffer();
        const embedded = await pdfDoc.embedJpg(buffer);
        resolve(embedded);
      };
      img.onerror = reject;
      img.src = src;
    });
  };

  // Handle PDF file added for PDF -> Images
  const handlePdfFileAdded = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setPdfFile(file);
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      setPdfPageCount(pdf.getPageCount());
      toast.success(`Loaded ${file.name} (${pdf.getPageCount()} pages)`);
    } catch (err: any) {
      toast.error("Failed to read PDF: " + err.message);
      setPdfFile(null);
    }
  };

  const convertPdfToImages = async () => {
    if (!pdfFile) return;
    setIsConvertingPdfToImg(true);

    try {
      const pdfjs = await getPdfJs();
      const data = await pdfFile.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      const zip = new JSZip();

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: exportScale });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvas,
          canvasContext: ctx,
          viewport,
        }).promise;

        const mime = exportFormat === "png" ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(mime, 0.9);
        const base64Data = dataUrl.split(",")[1];
        zip.file(`page_${i}.${exportFormat}`, base64Data, { base64: true });
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(
        zipBlob,
        `${pdfFile.name.replace(/\.pdf$/i, "")}_images_${exportFormat}.zip`
      );
      toast.success(`Exported ${numPages} page images as ZIP archive!`);
    } catch (err: any) {
      toast.error("Failed to convert PDF to images: " + err.message);
    } finally {
      setIsConvertingPdfToImg(false);
    }
  };

  const resetAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setPdfFile(null);
    setPdfPageCount(0);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="PDF Utilities"
        title="Image ↔ PDF Converter"
        description="Convert JPG, PNG, and WebP images to a combined PDF, or export all pages of a PDF to high-res images."
        onReset={resetAll}
      />

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-4 mb-6">
        <button
          onClick={() => setActiveTab("img2pdf")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "img2pdf"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileImage className="w-4 h-4" />
          <span>Images to PDF</span>
          {images.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-mono">
              {images.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("pdf2img")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "pdf2img"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>PDF to Images (ZIP)</span>
          {pdfFile && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-mono">
              {pdfPageCount}p
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Images to PDF */}
      {activeTab === "img2pdf" && (
        <div className="space-y-6">
          <FileDropzone
            onFilesSelected={handleImagesAdded}
            accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
            maxFiles={50}
            title="Drop images to convert into a PDF"
            subtitle="JPG, PNG, WebP supported. Arrange page sequence before generating."
          />

          {images.length > 0 && (
            <div className="space-y-5">
              {/* Settings strip */}
              <div className="p-4 rounded-2xl border border-border bg-card flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Page Size
                    </label>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(e.target.value as any)}
                      className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium focus:ring-1 focus:ring-primary"
                    >
                      <option value="fit">Fit to Image Aspect Ratio</option>
                      <option value="a4">Standard A4 Document</option>
                      <option value="letter">US Letter</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Margin
                    </label>
                    <select
                      value={pageMargin}
                      onChange={(e) => setPageMargin(parseInt(e.target.value, 10))}
                      className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium focus:ring-1 focus:ring-primary"
                    >
                      <option value="0">No Margins (Full Bleed)</option>
                      <option value="10">Small (10pt)</option>
                      <option value="25">Normal (25pt)</option>
                      <option value="40">Wide (40pt)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {images.length} image(s) queued
                  </span>
                  <button
                    onClick={() => {
                      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
                      setImages([]);
                    }}
                    className="text-xs text-destructive hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Images reordering grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="rounded-xl border border-border bg-card p-2 flex flex-col items-center space-y-2 group shadow-xs"
                  >
                    <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center border border-border/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.previewUrl}
                        alt={img.file.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 left-1 bg-black/70 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                    </div>

                    <p className="text-[11px] font-medium text-foreground truncate w-full text-center">
                      {img.file.name}
                    </p>

                    <div className="flex items-center justify-between w-full pt-1 border-t border-border/40">
                      <div className="flex items-center">
                        <button
                          onClick={() => moveImage(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20"
                        >
                          <ArrowUp className="w-3.5 h-3.5 -rotate-90" />
                        </button>
                        <button
                          onClick={() => moveImage(idx, 1)}
                          disabled={idx === images.length - 1}
                          className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20"
                        >
                          <ArrowDown className="w-3.5 h-3.5 -rotate-90" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeImage(idx)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={convertImagesToPdf}
                  disabled={isConvertingImgToPdf}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {isConvertingImgToPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Convert & Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: PDF to Images */}
      {activeTab === "pdf2img" && (
        <div className="space-y-6">
          {!pdfFile ? (
            <FileDropzone
              onFilesSelected={handlePdfFileAdded}
              accept={{ "application/pdf": [".pdf"] }}
              maxFiles={1}
              title="Upload a PDF to extract pages as images"
              subtitle="Each page will be rendered into crisp image files and packed into a zip."
            />
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl border border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-primary" />
                    {pdfFile.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(pdfFile.size)} • {pdfPageCount} pages ready for extraction
                  </p>
                </div>

                <button
                  onClick={() => {
                    setPdfFile(null);
                    setPdfPageCount(0);
                  }}
                  className="text-xs text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg"
                >
                  Change File
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-foreground">Export Preferences</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                      Output Format
                    </label>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="png">PNG (Lossless, High Quality)</option>
                      <option value="jpeg">JPEG (Smaller File Size)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                      Resolution / DPI Scale
                    </label>
                    <select
                      value={exportScale}
                      onChange={(e) => setExportScale(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="1">1.0x (Standard 72 DPI)</option>
                      <option value="1.5">1.5x (High 108 DPI)</option>
                      <option value="2">2.0x (Retina 144 DPI - Sharpest)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={convertPdfToImages}
                  disabled={isConvertingPdfToImg}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {isConvertingPdfToImg ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Rendering & Zipping Pages...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Export All Pages as ZIP</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
