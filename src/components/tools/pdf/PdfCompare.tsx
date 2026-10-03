"use client";

import * as React from "react";
import { Download, GitCompareArrows, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { getPdfJs } from "@/lib/pdf-helpers";
import { downloadBlob, formatBytes } from "@/lib/utils";

interface ComparedPage {
  page: number;
  before: string;
  after: string;
}

async function extractPageText(file: File): Promise<string[]> {
  const pdfjs = await getPdfJs();
  const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" ").replace(/\s+/g, " ").trim());
  }
  return pages;
}

export function PdfCompare() {
  const [beforeFile, setBeforeFile] = React.useState<File | null>(null);
  const [afterFile, setAfterFile] = React.useState<File | null>(null);
  const [beforePages, setBeforePages] = React.useState<string[]>([]);
  const [afterPages, setAfterPages] = React.useState<string[]>([]);
  const [changes, setChanges] = React.useState<ComparedPage[] | null>(null);
  const [isComparing, setIsComparing] = React.useState(false);

  const compare = async () => {
    if (!beforeFile || !afterFile) return;
    setIsComparing(true);
    setChanges(null);
    try {
      const [left, right] = await Promise.all([extractPageText(beforeFile), extractPageText(afterFile)]);
      setBeforePages(left);
      setAfterPages(right);
      const count = Math.max(left.length, right.length);
      const differences: ComparedPage[] = [];
      for (let index = 0; index < count; index += 1) {
        const before = left[index] || "[Page is missing]";
        const after = right[index] || "[Page is missing]";
        if (before !== after) differences.push({ page: index + 1, before, after });
      }
      setChanges(differences);
      if (!left.some(Boolean) && !right.some(Boolean)) {
        toast.warning("No selectable text found. Scanned pages need OCR before they can be compared.");
      } else {
        toast.success(differences.length ? `${differences.length} page(s) differ.` : "The extracted page text matches.");
      }
    } catch (error) {
      toast.error(`Could not compare PDFs: ${(error as Error).message}`);
    } finally {
      setIsComparing(false);
    }
  };

  const report = () => {
    if (changes === null) return;
    const content = changes.length
      ? changes.map(({ page, before, after }) => `## Page ${page}\n\n### Previous\n${before}\n\n### Current\n${after}`).join("\n\n---\n\n")
      : "# PDF comparison\n\nNo differences found in extracted page text.";
    downloadBlob(new Blob([`# PDF comparison\n\n${content}`], { type: "text/markdown;charset=utf-8" }), "pdf-comparison.md");
  };

  const reset = () => {
    setBeforeFile(null);
    setAfterFile(null);
    setBeforePages([]);
    setAfterPages([]);
    setChanges(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader category="PDF Utilities" title="Compare PDFs" description="Compare selectable text page by page and export a Markdown change report." onReset={reset} />
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3"><h2 className="text-sm font-semibold">Previous version</h2><FileDropzone onFilesSelected={(files) => { setBeforeFile(files[0] || null); setChanges(null); }} accept={{ "application/pdf": [".pdf"] }} maxFiles={1} title={beforeFile?.name || "Choose first PDF"} subtitle={beforeFile ? formatBytes(beforeFile.size) : "Original document"} /></div>
        <div className="space-y-3"><h2 className="text-sm font-semibold">Current version</h2><FileDropzone onFilesSelected={(files) => { setAfterFile(files[0] || null); setChanges(null); }} accept={{ "application/pdf": [".pdf"] }} maxFiles={1} title={afterFile?.name || "Choose second PDF"} subtitle={afterFile ? formatBytes(afterFile.size) : "Updated document"} /></div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={compare} disabled={!beforeFile || !afterFile || isComparing} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{isComparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompareArrows className="h-4 w-4" />}Compare documents</button>
        {changes !== null && <button onClick={report} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold"><Download className="h-4 w-4" />Download report</button>}
      </div>
      {changes !== null && (
        <section className="mt-6 space-y-3" aria-live="polite">
          <h2 className="text-sm font-semibold">{changes.length ? `${changes.length} changed page(s)` : "No text differences found"} <span className="font-normal text-muted-foreground">· {beforePages.length} vs {afterPages.length} pages</span></h2>
          {changes.map(({ page, before, after }) => (
            <article key={page} className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold">Page {page}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-rose-500/5 p-3 text-xs">{before}</pre>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-emerald-500/5 p-3 text-xs">{after}</pre>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}