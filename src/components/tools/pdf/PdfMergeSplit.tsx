"use client";

import * as React from "react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { toast } from "sonner";
import {
  Files,
  Scissors,
  ArrowUp,
  ArrowDown,
  Trash2,
  Download,
  Loader2,
  CheckSquare,
  Square,
  FileCheck,
  Eye,
} from "lucide-react";
import { formatBytes, downloadBlob } from "@/lib/utils";
import { renderPdfThumbnails, parsePageRanges, RenderedPageInfo } from "@/lib/pdf-helpers";

interface PdfItem {
  id: string;
  file: File;
  pageCount: number;
}

export function PdfMergeSplit() {
  const [activeTab, setActiveTab] = React.useState<"merge" | "split">("merge");

  // Merge State
  const [mergeFiles, setMergeFiles] = React.useState<PdfItem[]>([]);
  const [isMerging, setIsMerging] = React.useState(false);

  // Split State
  const [splitFile, setSplitFile] = React.useState<File | null>(null);
  const [splitThumbnails, setSplitThumbnails] = React.useState<RenderedPageInfo[]>([]);
  const [selectedPages, setSelectedPages] = React.useState<number[]>([]);
  const [rangeInput, setRangeInput] = React.useState("");
  const [isRenderingThumbnails, setIsRenderingThumbnails] = React.useState(false);
  const [isSplitting, setIsSplitting] = React.useState(false);

  // Handle files for merge
  const handleMergeFilesAdded = async (files: File[]) => {
    const newItems: PdfItem[] = [];
    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
        newItems.push({
          id: Math.random().toString(36).substring(7),
          file,
          pageCount: pdf.getPageCount(),
        });
      } catch (err) {
        toast.error(`Could not read ${file.name}. It might be password-protected.`);
      }
    }
    setMergeFiles((prev) => [...prev, ...newItems]);
    toast.success(`Added ${newItems.length} PDF file(s)`);
  };

  const moveMergeItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= mergeFiles.length) return;
    const updated = [...mergeFiles];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setMergeFiles(updated);
  };

  const removeMergeItem = (index: number) => {
    setMergeFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const executeMerge = async () => {
    if (mergeFiles.length < 2) {
      toast.warning("Please add at least 2 PDF files to merge.");
      return;
    }
    setIsMerging(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const item of mergeFiles) {
        const buffer = await item.file.arrayBuffer();
        const doc = await PDFDocument.load(buffer);
        const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      downloadBlob(blob, `merged_${Date.now()}.pdf`);
      toast.success("PDFs successfully merged and downloaded!");
    } catch (err: any) {
      toast.error("Failed to merge PDFs: " + err.message);
    } finally {
      setIsMerging(false);
    }
  };

  // Handle file for split
  const handleSplitFileAdded = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setSplitFile(file);
    setIsRenderingThumbnails(true);
    try {
      const thumbnails = await renderPdfThumbnails(file, 50, 0.4);
      setSplitThumbnails(thumbnails);
      // default select all
      const allNums = thumbnails.map((t) => t.pageNumber);
      setSelectedPages(allNums);
      setRangeInput(`1-${allNums.length}`);
      toast.success(`Loaded ${file.name} (${allNums.length} pages)`);
    } catch (err: any) {
      toast.error("Failed to load PDF preview: " + err.message);
      setSplitFile(null);
    } finally {
      setIsRenderingThumbnails(false);
    }
  };

  const togglePageSelection = (num: number) => {
    setSelectedPages((prev) =>
      prev.includes(num) ? prev.filter((p) => p !== num) : [...prev, num].sort((a, b) => a - b)
    );
  };

  const handleRangeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRangeInput(val);
    if (!splitThumbnails.length) return;
    const parsed = parsePageRanges(val, splitThumbnails.length);
    setSelectedPages(parsed);
  };

  const extractSelectedPages = async (asZip = false) => {
    if (!splitFile || selectedPages.length === 0) {
      toast.warning("Please select at least one page to extract.");
      return;
    }
    setIsSplitting(true);
    try {
      const buffer = await splitFile.arrayBuffer();
      const srcDoc = await PDFDocument.load(buffer);

      if (asZip) {
        // Individual pages in a zip
        const zip = new JSZip();
        for (const pageNum of selectedPages) {
          const singleDoc = await PDFDocument.create();
          const [copied] = await singleDoc.copyPages(srcDoc, [pageNum - 1]);
          singleDoc.addPage(copied);
          const bytes = await singleDoc.save();
          zip.file(`page_${pageNum}.pdf`, bytes);
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        downloadBlob(zipBlob, `${splitFile.name.replace(/\.pdf$/i, "")}_pages.zip`);
        toast.success("Extracted pages downloaded as ZIP archive!");
      } else {
        // Combined selected pages
        const newDoc = await PDFDocument.create();
        const indices = selectedPages.map((p) => p - 1);
        const copiedPages = await newDoc.copyPages(srcDoc, indices);
        copiedPages.forEach((p) => newDoc.addPage(p));
        const bytes = await newDoc.save();
        const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
        downloadBlob(blob, `extracted_${Date.now()}.pdf`);
        toast.success("Extracted pages downloaded!");
      }
    } catch (err: any) {
      toast.error("Failed to extract pages: " + err.message);
    } finally {
      setIsSplitting(false);
    }
  };

  const resetAll = () => {
    setMergeFiles([]);
    setSplitFile(null);
    setSplitThumbnails([]);
    setSelectedPages([]);
    setRangeInput("");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="PDF Utilities"
        title="PDF Merger & Splitter"
        description="Merge multiple PDF documents into one, or extract custom page ranges using thumbnail selection."
        onReset={resetAll}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-4 mb-6">
        <button
          onClick={() => setActiveTab("merge")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "merge"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <Files className="w-4 h-4" />
          <span>Merge Multiple PDFs</span>
          {mergeFiles.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-mono">
              {mergeFiles.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("split")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "split"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>Split / Extract Pages</span>
          {splitFile && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-mono">
              1 file
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Merge */}
      {activeTab === "merge" && (
        <div className="space-y-6">
          <FileDropzone
            onFilesSelected={handleMergeFilesAdded}
            accept={{ "application/pdf": [".pdf"] }}
            maxFiles={30}
            title="Drag & drop PDF files to combine"
            subtitle="Add all files you want to merge. You can reorder them below before exporting."
          />

          {mergeFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Selected Documents ({mergeFiles.length})</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Total: {mergeFiles.reduce((acc, f) => acc + f.pageCount, 0)} pages
                  </span>
                </h3>

                <button
                  onClick={() => setMergeFiles([])}
                  className="text-xs text-destructive hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-2">
                {mergeFiles.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(item.file.size)} • {item.pageCount} page(s)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      <button
                        onClick={() => moveMergeItem(idx, -1)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveMergeItem(idx, 1)}
                        disabled={idx === mergeFiles.length - 1}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeMergeItem(idx)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={executeMerge}
                  disabled={isMerging || mergeFiles.length < 2}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {isMerging ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Merging Documents...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Merge & Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Split / Extract */}
      {activeTab === "split" && (
        <div className="space-y-6">
          {!splitFile ? (
            <FileDropzone
              onFilesSelected={handleSplitFileAdded}
              accept={{ "application/pdf": [".pdf"] }}
              maxFiles={1}
              title="Select a PDF to split or extract pages"
              subtitle="Upload 1 PDF file to inspect individual page thumbnails and slice out page ranges."
            />
          ) : (
            <div className="space-y-6">
              {/* Controls bar */}
              <div className="p-4 rounded-2xl border border-border bg-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-primary" />
                    {splitFile.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(splitFile.size)} • {splitThumbnails.length} pages loaded • {selectedPages.length} selected
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      const all = splitThumbnails.map((t) => t.pageNumber);
                      setSelectedPages(all);
                      setRangeInput(`1-${all.length}`);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-medium"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPages([]);
                      setRangeInput("");
                    }}
                    className="px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-medium"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={() => {
                      setSplitFile(null);
                      setSplitThumbnails([]);
                      setSelectedPages([]);
                      setRangeInput("");
                    }}
                    className="px-3 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 text-xs font-medium"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Range syntax input */}
              <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  Page Range Filter (Syntax: 1-3, 5, 8)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={rangeInput}
                    onChange={handleRangeInputChange}
                    placeholder="e.g. 1-4, 7, 9-12"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  You can type custom page ranges above or simply click the thumbnail cards below.
                </p>
              </div>

              {/* Thumbnails grid */}
              {isRenderingThumbnails ? (
                <div className="p-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm">Rendering page preview thumbnails locally...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {splitThumbnails.map((thumb) => {
                    const isSelected = selectedPages.includes(thumb.pageNumber);
                    return (
                      <div
                        key={thumb.pageNumber}
                        onClick={() => togglePageSelection(thumb.pageNumber)}
                        className={`group relative rounded-xl border-2 p-2 cursor-pointer transition-all bg-card flex flex-col items-center ${
                          isSelected
                            ? "border-primary shadow-md ring-2 ring-primary/20"
                            : "border-border hover:border-muted-foreground/40 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <div className="relative w-full aspect-[3/4] bg-muted rounded-lg overflow-hidden flex items-center justify-center border border-border/50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumb.dataUrl}
                            alt={`Page ${thumb.pageNumber}`}
                            className="object-contain w-full h-full"
                          />
                          <div className="absolute top-1.5 right-1.5">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-primary fill-primary/20 bg-background rounded" />
                            ) : (
                              <Square className="w-4 h-4 text-muted-foreground bg-background rounded" />
                            )}
                          </div>
                        </div>
                        <span className="mt-2 text-xs font-semibold text-foreground">
                          Page {thumb.pageNumber}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Extraction Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center justify-end gap-3">
                <button
                  onClick={() => extractSelectedPages(true)}
                  disabled={isSplitting || selectedPages.length === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold shadow-xs disabled:opacity-40"
                >
                  {isSplitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Extract as Individual PDFs (.ZIP)</span>
                </button>

                <button
                  onClick={() => extractSelectedPages(false)}
                  disabled={isSplitting || selectedPages.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-md hover:bg-primary/90 transition-all disabled:opacity-40"
                >
                  {isSplitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Extract to Single PDF ({selectedPages.length} pages)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
