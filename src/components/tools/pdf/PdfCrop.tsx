"use client";

import * as React from "react";
import { Download, Loader2, Scissors } from "lucide-react";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { parsePageRanges } from "@/lib/pdf-helpers";
import { downloadBlob, formatBytes } from "@/lib/utils";

export function PdfCrop() {
  const [file, setFile] = React.useState<File | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [pageRange, setPageRange] = React.useState("");
  const [margins, setMargins] = React.useState({ top: 5, right: 5, bottom: 5, left: 5 });
  const [isProcessing, setIsProcessing] = React.useState(false);

  const loadFile = async (files: File[]) => {
    const selected = files[0];
    if (!selected) return;
    try {
      const document = await PDFDocument.load(await selected.arrayBuffer());
      setFile(selected);
      setPageCount(document.getPageCount());
      setPageRange(`1-${document.getPageCount()}`);
    } catch (error) {
      toast.error(`Could not open PDF: ${(error as Error).message}`);
    }
  };

  const crop = async () => {
    if (!file) return;
    if (margins.left + margins.right >= 100 || margins.top + margins.bottom >= 100) {
      toast.error("Opposing margins must total less than 100%.");
      return;
    }
    const selectedPages = pageRange.trim()
      ? parsePageRanges(pageRange, pageCount)
      : Array.from({ length: pageCount }, (_, index) => index + 1);
    if (!selectedPages.length) {
      toast.error("Enter at least one valid page number or range.");
      return;
    }

    setIsProcessing(true);
    try {
      const document = await PDFDocument.load(await file.arrayBuffer());
      selectedPages.forEach((pageNumber) => {
        const page = document.getPage(pageNumber - 1);
        const box = page.getMediaBox();
        const left = (box.width * margins.left) / 100;
        const right = (box.width * margins.right) / 100;
        const top = (box.height * margins.top) / 100;
        const bottom = (box.height * margins.bottom) / 100;
        page.setCropBox(box.x + left, box.y + bottom, box.width - left - right, box.height - top - bottom);
      });
      const bytes = await document.save();
      downloadBlob(new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }), `cropped_${file.name}`);
      toast.success(`Cropped ${selectedPages.length} page(s).`);
    } catch (error) {
      toast.error(`Could not crop PDF: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPageCount(0);
    setPageRange("");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <ToolHeader category="PDF Utilities" title="Crop PDF Pages" description="Set crop margins as a percentage of each page and apply them to selected page ranges." onReset={reset} />
      {!file ? (
        <FileDropzone onFilesSelected={loadFile} accept={{ "application/pdf": [".pdf"] }} maxFiles={1} title="Choose a PDF to crop" subtitle="Your file stays in this browser." />
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-4 text-sm"><span className="font-semibold">{file.name}</span><span className="text-muted-foreground"> · {formatBytes(file.size)} · {pageCount} pages</span></div>
          <label className="block space-y-2">
            <span className="text-sm font-semibold">Pages</span>
            <input value={pageRange} onChange={(event) => setPageRange(event.target.value)} placeholder={`1-${pageCount}`} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <span className="text-xs text-muted-foreground">Use ranges such as 1-3, 5. Leave blank to crop every page.</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.keys(margins) as Array<keyof typeof margins>).map((side) => (
              <label key={side} className="space-y-1.5">
                <span className="block text-xs font-semibold capitalize text-muted-foreground">{side} margin (%)</span>
                <input type="number" min="0" max="99" value={margins[side]} onChange={(event) => setMargins((current) => ({ ...current, [side]: Math.max(0, Math.min(99, Number(event.target.value))) }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </label>
            ))}
          </div>
          <button onClick={crop} disabled={isProcessing} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Scissors className="h-4 w-4" /><Download className="h-4 w-4" /></>}
            Crop and download
          </button>
        </div>
      )}
    </div>
  );
}