"use client";

import * as React from "react";
import { PDFDocument, PageSizes } from "pdf-lib";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { downloadBlob, formatBytes } from "@/lib/utils";
import { getPdfJs } from "@/lib/pdf-helpers";
import { toast } from "sonner";
import { Download, FileDown, Loader2, Sliders } from "lucide-react";

const QUALITY_PRESETS = [
  { value: 0.55, label: "Maximum compression", scale: 1 },
  { value: 0.72, label: "Balanced", scale: 1.35 },
  { value: 0.88, label: "High quality", scale: 1.8 },
];

export function PdfCompressor() {
  const [file, setFile] = React.useState<File | null>(null);
  const [quality, setQuality] = React.useState(0.72);
  const [result, setResult] = React.useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const selectedPreset = QUALITY_PRESETS.find((preset) => preset.value === quality) || QUALITY_PRESETS[1];

  const compress = async (selected: File, preset = selectedPreset) => {
    setIsProcessing(true);
    setResult(null);
    try {
      const pdfjs = await getPdfJs();
      const source = await pdfjs.getDocument({ data: await selected.arrayBuffer() }).promise;
      const output = await PDFDocument.create();
      for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
        const sourcePage = await source.getPage(pageNumber);
        const viewport = sourcePage.getViewport({ scale: preset.scale });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await sourcePage.render({ canvas, canvasContext: context, viewport }).promise;
        const jpeg = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not encode page")), "image/jpeg", preset.value));
        const image = await output.embedJpg(await jpeg.arrayBuffer());
        const page = output.addPage([PageSizes.A4[0], PageSizes.A4[1]]);
        const margin = 24;
        const scale = Math.min((page.getWidth() - margin * 2) / image.width, (page.getHeight() - margin * 2) / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        page.drawImage(image, { x: (page.getWidth() - width) / 2, y: (page.getHeight() - height) / 2, width, height });
      }
      const bytes = await output.save({ useObjectStreams: true });
      const compressed = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      setResult(compressed);
      toast.success(`Compressed ${source.numPages} page(s) from ${formatBytes(selected.size)} to ${formatBytes(compressed.size)}.`);
    } catch (error) {
      toast.error(`Compression failed: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <ToolHeader category="PDF Utilities" title="PDF Compressor" description="Reduce PDF size locally by optimizing page images with selectable quality presets." onReset={reset} />
      {!file ? (
        <FileDropzone onFilesSelected={(files) => { const selected = files[0]; if (selected) { setFile(selected); compress(selected); } }} accept={{ "application/pdf": [".pdf"] }} maxFiles={1} title="Upload a PDF to compress" subtitle="Rasterized output is created entirely in your browser." />
      ) : (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-border bg-card flex items-center justify-between gap-4"><div className="flex items-center gap-3"><FileDown className="w-8 h-8 text-primary" /><div><h2 className="text-sm font-bold">{file.name}</h2><p className="text-xs text-muted-foreground">Original size: {formatBytes(file.size)}</p></div></div><button onClick={reset} className="text-xs text-destructive hover:underline">Change PDF</button></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {QUALITY_PRESETS.map((preset) => <button key={preset.value} onClick={() => { setQuality(preset.value); compress(file, preset); }} className={`p-4 rounded-2xl border text-left ${quality === preset.value ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted"}`}><Sliders className="w-4 h-4 text-primary mb-2" /><span className="block text-sm font-bold">{preset.label}</span><span className="block text-xs text-muted-foreground mt-1">JPEG quality {Math.round(preset.value * 100)}%</span></button>)}
          </div>
          <div className="p-6 rounded-2xl border border-border bg-card text-center space-y-4"><p className="text-sm text-muted-foreground">{isProcessing ? "Optimizing PDF pages..." : result ? `Compressed size: ${formatBytes(result.size)}` : "Choose a quality preset to begin."}</p>{isProcessing ? <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /> : result && <button onClick={() => downloadBlob(result, `compressed_${file.name}`)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"><Download className="w-4 h-4" />Download compressed PDF</button>}</div>
        </div>
      )}
    </div>
  );
}
