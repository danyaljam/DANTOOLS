"use client";

import * as React from "react";
import { createWorker } from "tesseract.js";
import { Check, Copy, Download, FileText, Globe2, Loader2, ScanText, Wifi, WifiOff, X } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { getPdfJs } from "@/lib/pdf-helpers";
import { downloadBlob, downloadText, formatBytes } from "@/lib/utils";

const languages = [
  { code: "eng", label: "English", offline: true },
  { code: "spa", label: "Spanish", offline: false },
  { code: "fra", label: "French", offline: false },
  { code: "deu", label: "German", offline: false },
  { code: "ita", label: "Italian", offline: false },
  { code: "por", label: "Portuguese", offline: false },
  { code: "nld", label: "Dutch", offline: false },
  { code: "rus", label: "Russian", offline: false },
  { code: "ara", label: "Arabic", offline: false },
  { code: "chi_sim", label: "Chinese (Simplified)", offline: false },
  { code: "jpn", label: "Japanese", offline: false },
];

interface OcrPageResult {
  fileName: string;
  pageNumber: number;
  text: string;
  confidence: number | null;
  source: "PDF text layer" | "OCR";
}

interface OcrProgress {
  current: number;
  total: number;
  status: string;
  stage: number;
}

const isPdf = (file: File) =>
  file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

export function PdfOcr() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [results, setResults] = React.useState<OcrPageResult[]>([]);
  const [language, setLanguage] = React.useState("eng");
  const [forceOcr, setForceOcr] = React.useState(false);
  const [createSearchablePdf, setCreateSearchablePdf] = React.useState(false);
  const [searchablePdfParts, setSearchablePdfParts] = React.useState<Uint8Array[]>([]);
  const [searchablePdfName, setSearchablePdfName] = React.useState("ocr-results");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(true);
  const [progress, setProgress] = React.useState<OcrProgress>({ current: 0, total: 0, status: "", stage: 0 });
  const workerRef = React.useRef<Awaited<ReturnType<typeof createWorker>> | null>(null);
  const cancelRef = React.useRef(false);

  React.useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);
    updateConnection();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
      void workerRef.current?.terminate();
    };
  }, []);

  const fullText = React.useMemo(
    () => results.map((result) => `--- ${result.fileName} · Page ${result.pageNumber} ---\n${result.text}`).join("\n\n"),
    [results]
  );

  const getWorker = async () => {
    if (workerRef.current) return workerRef.current;
    const selectedLanguage = languages.find((item) => item.code === language);
    setProgress((current) => ({ ...current, status: "Starting OCR engine", stage: 0 }));
    const worker = await createWorker(language, 1, {
      workerPath: "/tesseract/worker.min.js",
      corePath: "/tesseract/core",
      langPath: selectedLanguage?.offline
        ? "/tesseract/lang/4.0.0_best_int"
        : `https://cdn.jsdelivr.net/npm/@tesseract.js-data/${language}/4.0.0_best_int`,
      cachePath: "dantools-ocr-v1",
      cacheMethod: "write",
      gzip: true,
      logger: (message) => {
        setProgress((current) => ({ ...current, status: message.status, stage: Math.round(message.progress * 100) }));
      },
    });
    workerRef.current = worker;
    await worker.setParameters({ preserve_interword_spaces: "1" });
    return worker;
  };

  const processFiles = async (selectedFiles: File[]) => {
    cancelRef.current = false;
    setFiles(selectedFiles);
    setResults([]);
    setSearchablePdfParts([]);
    setIsProcessing(true);
    setProgress({ current: 0, total: 0, status: "Preparing documents", stage: 0 });

    const pageResults: OcrPageResult[] = [];
    const pdfParts: Uint8Array[] = [];
    let totalPages = 0;
    let processedPages = 0;

    try {
      const pdfjs = await getPdfJs();
      for (const file of selectedFiles) {
        if (cancelRef.current) break;
        const fileResults: OcrPageResult[] = [];

        if (isPdf(file)) {
          const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
          const pdfDocument = await loadingTask.promise;
          totalPages += pdfDocument.numPages;
          setProgress((current) => ({ ...current, total: totalPages }));

          try {
            for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
              if (cancelRef.current) break;
              setProgress((current) => ({ ...current, current: processedPages, status: `Reading ${file.name}, page ${pageNumber}`, stage: 0 }));
              const page = await pdfDocument.getPage(pageNumber);
              const textContent = await page.getTextContent();
              const embeddedText = textContent.items
                .map((item) => ("str" in item ? item.str : ""))
                .filter(Boolean)
                .join(" ")
                .replace(/\s+/g, " ")
                .trim();

              if (embeddedText.length >= 20 && !forceOcr && !createSearchablePdf) {
                fileResults.push({ fileName: file.name, pageNumber, text: embeddedText, confidence: null, source: "PDF text layer" });
              } else {
                const worker = await getWorker();
                const viewport = page.getViewport({ scale: 2 });
                const canvas = document.createElement("canvas");
                canvas.width = Math.ceil(viewport.width);
                canvas.height = Math.ceil(viewport.height);
                const context = canvas.getContext("2d");
                if (!context) throw new Error("This browser could not create a page canvas.");
                await page.render({ canvas, canvasContext: context, viewport }).promise;
                const { data } = await worker.recognize(canvas, {}, createSearchablePdf ? { pdf: true } : undefined);
                canvas.width = 0;
                canvas.height = 0;
                if (createSearchablePdf && data.pdf) pdfParts.push(Uint8Array.from(data.pdf));
                fileResults.push({ fileName: file.name, pageNumber, text: data.text.trim(), confidence: Math.round(data.confidence), source: "OCR" });
              }

              processedPages += 1;
              setProgress((current) => ({ ...current, current: processedPages, total: totalPages, stage: 100 }));
            }
          } finally {
            await loadingTask.destroy();
          }
        } else {
          totalPages += 1;
          setProgress((current) => ({ ...current, total: totalPages, current: processedPages }));
          const worker = await getWorker();
          setProgress((current) => ({ ...current, status: `Recognizing ${file.name}`, stage: 0 }));
          const { data } = await worker.recognize(file, {}, createSearchablePdf ? { pdf: true } : undefined);
          if (createSearchablePdf && data.pdf) pdfParts.push(Uint8Array.from(data.pdf));
          fileResults.push({ fileName: file.name, pageNumber: 1, text: data.text.trim(), confidence: Math.round(data.confidence), source: "OCR" });
          processedPages += 1;
          setProgress((current) => ({ ...current, current: processedPages, stage: 100 }));
        }

        pageResults.push(...fileResults);
        setResults([...pageResults]);
      }

      if (!cancelRef.current && pdfParts.length) {
        setSearchablePdfParts(pdfParts);
        setSearchablePdfName(selectedFiles.length === 1 ? selectedFiles[0].name.replace(/\.[^/.]+$/, "") : "ocr-results");
      }
      if (!cancelRef.current) toast.success(`Processed ${processedPages} page(s) locally.`);
    } catch (error) {
      if (!cancelRef.current) toast.error(`OCR failed: ${error instanceof Error ? error.message : "Unknown OCR error"}`);
    } finally {
      const worker = workerRef.current;
      workerRef.current = null;
      if (worker) await worker.terminate();
      setIsProcessing(false);
      setProgress((current) => ({ ...current, status: cancelRef.current ? "Cancelled" : "Complete" }));
    }
  };

  const cancel = async () => {
    cancelRef.current = true;
    const worker = workerRef.current;
    workerRef.current = null;
    if (worker) await worker.terminate();
    setIsProcessing(false);
    setProgress((current) => ({ ...current, status: "Cancelled" }));
  };

  const reset = () => {
    if (isProcessing) void cancel();
    setFiles([]);
    setResults([]);
    setProgress({ current: 0, total: 0, status: "", stage: 0 });
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success("OCR text copied.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Clipboard access is unavailable in this browser.");
    }
  };

  const downloadTextFile = (format: "txt" | "md" | "json") => {
    const baseName = files.length === 1 ? files[0].name.replace(/\.[^/.]+$/, "") : "ocr-results";
    if (format === "json") {
      downloadText(JSON.stringify(results, null, 2), `${baseName}.json`, "application/json;charset=utf-8");
    } else if (format === "md") {
      const markdown = results.map((result) => `## ${result.fileName} · Page ${result.pageNumber}\n\n${result.text}`).join("\n\n---\n\n");
      downloadText(markdown, `${baseName}.md`, "text/markdown;charset=utf-8");
    } else {
      downloadText(fullText, `${baseName}.txt`);
    }
  };

  const downloadSearchablePdf = async () => {
    try {
      const output = await PDFDocument.create();
      for (const part of searchablePdfParts) {
        const pagePdf = await PDFDocument.load(part);
        const pages = await output.copyPages(pagePdf, pagePdf.getPageIndices());
        pages.forEach((page) => output.addPage(page));
      }
      const bytes = await output.save();
      downloadBlob(new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }), `${searchablePdfName}-searchable.pdf`);
      toast.success("Searchable PDF downloaded.");
    } catch (error) {
      toast.error(`Could not create searchable PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const imageCount = results.filter((result) => result.source === "OCR").length;
  const selectedLanguage = languages.find((item) => item.code === language);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <ToolHeader
        category="PDF Utilities"
        title="OCR Studio"
        description="Recognize scanned PDFs and images locally, with no account, upload, or page quota."
        onReset={reset}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          {isOnline ? <Wifi className="h-4 w-4 text-emerald-600" /> : <WifiOff className="h-4 w-4 text-amber-600" />}
          <span>{isOnline ? "Online" : "Offline"}</span><span aria-hidden="true">·</span><span>Recognition runs on this device</span>
        </div>
        <span className="text-xs text-muted-foreground">English is included offline. Other languages download once and are cached for offline reuse.</span>
      </div>

      {!files.length ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="block space-y-2 text-sm font-medium">
              <span className="flex items-center gap-2"><Globe2 className="h-4 w-4" />Recognition language</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm sm:w-72">
                {languages.map((item) => <option key={item.code} value={item.code}>{item.label}{item.offline ? " · Offline" : " · Download on first use"}</option>)}
              </select>
            </label>
            <label className="flex min-h-10 items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={forceOcr} onChange={(event) => setForceOcr(event.target.checked)} className="h-4 w-4 accent-primary" />
              Re-recognize pages with existing text
            </label>
            <label className="flex min-h-10 items-center gap-2 text-sm text-muted-foreground sm:col-span-2">
              <input type="checkbox" checked={createSearchablePdf} onChange={(event) => setCreateSearchablePdf(event.target.checked)} className="h-4 w-4 accent-primary" />
              Create a searchable PDF (runs OCR on every page)
            </label>
          </div>
          <FileDropzone
            onFilesSelected={(selected) => void processFiles(selected)}
            accept={{ "application/pdf": [".pdf"], "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"], "image/bmp": [".bmp"] }}
            maxFiles={10}
            maxSizeMB={100}
            title="Drop scans, images, or PDFs"
            subtitle="Batch up to 10 files · searchable PDF text layers are extracted automatically"
          />
          {!isOnline && !selectedLanguage?.offline && <p className="text-sm text-amber-700 dark:text-amber-400">This language works offline only if its model was downloaded on this device before.</p>}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="text-sm font-semibold">{files.length} file(s) · {formatBytes(files.reduce((sum, file) => sum + file.size, 0))}</p>
              <p className="text-xs text-muted-foreground">{selectedLanguage?.label ?? language} · {results.length} page(s) ready · {imageCount} OCR page(s)</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={copyText} disabled={!fullText} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm disabled:opacity-50">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}Copy</button>
              <button onClick={() => downloadTextFile("txt")} disabled={!fullText} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm disabled:opacity-50"><Download className="h-4 w-4" />TXT</button>
              <button onClick={() => downloadTextFile("md")} disabled={!fullText} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm disabled:opacity-50"><Download className="h-4 w-4" />Markdown</button>
              <button onClick={() => downloadTextFile("json")} disabled={!fullText} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm disabled:opacity-50"><Download className="h-4 w-4" />JSON</button>
              {searchablePdfParts.length > 0 && <button onClick={() => void downloadSearchablePdf()} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm"><Download className="h-4 w-4" />Searchable PDF</button>}
              {isProcessing ? (
                <button onClick={() => void cancel()} className="inline-flex h-9 items-center gap-2 rounded-md bg-destructive px-3 text-sm text-destructive-foreground"><X className="h-4 w-4" />Cancel</button>
              ) : (
                <button onClick={reset} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm"><ScanText className="h-4 w-4" />New batch</button>
              )}
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-2 border-b border-border pb-4" aria-live="polite">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="flex min-w-0 items-center gap-2 truncate text-muted-foreground"><Loader2 className="h-4 w-4 shrink-0 animate-spin" />{progress.status || "Processing"}</span>
                <span className="shrink-0 tabular-nums">{progress.current}/{progress.total || "…"}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${progress.total ? Math.min(100, (progress.current / progress.total) * 100) : progress.stage}%` }} /></div>
            </div>
          )}

          <div className="divide-y divide-border">
            {results.map((result) => (
              <article key={`${result.fileName}-${result.pageNumber}`} className="grid gap-2 py-4 sm:grid-cols-[minmax(10rem,0.32fr)_1fr]">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0"><p className="break-all font-medium text-foreground">{result.fileName}</p><p>Page {result.pageNumber} · {result.source}</p>{result.confidence !== null && <p>{result.confidence}% confidence</p>}</div>
                </div>
                <textarea
                  aria-label={`${result.fileName}, page ${result.pageNumber} OCR text`}
                  value={result.text}
                  onChange={(event) => setResults((current) => current.map((item) => item.fileName === result.fileName && item.pageNumber === result.pageNumber ? { ...item, text: event.target.value } : item))}
                  rows={Math.min(16, Math.max(4, Math.ceil(result.text.length / 100)))}
                  className="w-full resize-y rounded-md border border-border bg-background p-3 font-mono text-xs leading-relaxed"
                />
              </article>
            ))}
            {!results.length && !isProcessing && <p className="py-8 text-center text-sm text-muted-foreground">No text was recognized in this batch.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
