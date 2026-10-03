"use client";

import * as React from "react";
import { Clipboard, Download, FileCode, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { getPdfJs } from "@/lib/pdf-helpers";
import { downloadBlob, formatBytes } from "@/lib/utils";

export function PdfToMarkdown() {
  const [file, setFile] = React.useState<File | null>(null);
  const [markdown, setMarkdown] = React.useState("");
  const [isExtracting, setIsExtracting] = React.useState(false);

  const extract = async (selected: File) => {
    setFile(selected);
    setMarkdown("");
    setIsExtracting(true);
    try {
      const pdfjs = await getPdfJs();
      const document = await pdfjs.getDocument({ data: await selected.arrayBuffer() }).promise;
      const output: string[] = [];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        const lines = content.items.map((item) => "str" in item ? item.str.trim() : "").filter(Boolean);
        output.push(`## Page ${pageNumber}\n\n${lines.join(" ")}`);
      }
      const result = output.join("\n\n");
      setMarkdown(result);
      if (!result.replace(/# Page \d+/g, "").trim()) toast.warning("No selectable text found. Scanned PDFs need OCR before extraction.");
      else toast.success(`Extracted text from ${document.numPages} page(s).`);
    } catch (error) {
      toast.error(`Could not extract PDF text: ${(error as Error).message}`);
      setFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const reset = () => { setFile(null); setMarkdown(""); };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      toast.success("Markdown copied to clipboard.");
    } catch {
      toast.error("Clipboard access is unavailable in this browser context.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <ToolHeader category="PDF Utilities" title="PDF to Markdown" description="Extract selectable text into Markdown, separated by page. Scanned pages require OCR." onReset={reset} />
      {!file ? (
        <FileDropzone onFilesSelected={(files) => { const selected = files[0]; if (selected) void extract(selected); }} accept={{ "application/pdf": [".pdf"] }} maxFiles={1} title="Choose a PDF to extract" subtitle="Text is extracted locally in your browser." />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-sm"><span className="font-semibold">{file.name}<span className="ml-2 font-normal text-muted-foreground">{formatBytes(file.size)}</span></span>
            <div className="flex gap-2">
              <button onClick={copy} disabled={!markdown || isExtracting} title="Copy Markdown" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold disabled:opacity-50"><Clipboard className="h-4 w-4" />Copy</button>
              <button onClick={() => downloadBlob(new Blob([markdown], { type: "text/markdown;charset=utf-8" }), `${file.name.replace(/\.pdf$/i, "")}.md`)} disabled={!markdown || isExtracting} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><Download className="h-4 w-4" />Download .md</button>
            </div>
          </div>
          {isExtracting ? <div className="flex items-center justify-center gap-3 rounded-xl border border-border p-12 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Extracting PDF text...</div> : (
            <div className="relative"><FileCode className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><textarea value={markdown} onChange={(event) => setMarkdown(event.target.value)} aria-label="Extracted Markdown" className="min-h-96 w-full resize-y rounded-xl border border-border bg-background p-4 font-mono text-sm leading-relaxed" /></div>
          )}
        </div>
      )}
    </div>
  );
}