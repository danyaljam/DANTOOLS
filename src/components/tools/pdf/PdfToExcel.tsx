"use client";

import * as React from "react";
import { Table, Download, Loader2, FileSpreadsheet, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { getPdfJs } from "@/lib/pdf-helpers";
import { downloadText, formatBytes } from "@/lib/utils";

export function PdfToExcel() {
  const [file, setFile] = React.useState<File | null>(null);
  const [extractedRows, setExtractedRows] = React.useState<string[][]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handlePdf = async (selected: File) => {
    setFile(selected);
    setIsProcessing(true);
    setExtractedRows([]);

    try {
      const pdfjs = await getPdfJs();
      const buffer = await selected.arrayBuffer();
      const pdfDoc = await pdfjs.getDocument({ data: buffer }).promise;
      const allRows: string[][] = [];

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();

        // Group text items by vertical Y position to detect tabular rows
        const rowsByY: Record<number, { x: number; text: string }[]> = {};

        textContent.items.forEach((item: any) => {
          if ("str" in item && item.str.trim()) {
            const y = Math.round(item.transform[5]); // Y coordinate
            const x = Math.round(item.transform[4]); // X coordinate
            // Find closest row within 4pt tolerance
            const existingY = Object.keys(rowsByY).find((k) => Math.abs(parseInt(k, 10) - y) <= 4);
            const targetY = existingY ? parseInt(existingY, 10) : y;

            if (!rowsByY[targetY]) rowsByY[targetY] = [];
            rowsByY[targetY].push({ x, text: item.str.trim() });
          }
        });

        // Sort rows top-to-bottom (higher Y to lower Y in PDF coordinate space)
        const sortedY = Object.keys(rowsByY)
          .map((k) => parseInt(k, 10))
          .sort((a, b) => b - a);

        for (const y of sortedY) {
          const rowItems = rowsByY[y].sort((a, b) => a.x - b.x);
          allRows.push(rowItems.map((item) => item.text));
        }
      }

      setExtractedRows(allRows.length ? allRows : [["No tabular text found"]]);
      toast.success(`Extracted ${allRows.length} table rows from PDF.`);
    } catch (err: any) {
      toast.error(`Could not read PDF: ${err.message}`);
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const csvContent = React.useMemo(() => {
    return extractedRows
      .map((row) =>
        row
          .map((cell) => {
            if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
          })
          .join(",")
      )
      .join("\n");
  }, [extractedRows]);

  const downloadCsv = () => {
    if (!file || !csvContent) return;
    downloadText(csvContent, `${file.name.replace(/\.pdf$/i, "")}.csv`, "text/csv;charset=utf-8;");
    toast.success("CSV spreadsheet downloaded!");
  };

  const copyCsv = () => {
    if (!csvContent) return;
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    toast.success("CSV table data copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setFile(null);
    setExtractedRows([]);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="PDF Utilities"
        title="PDF to EXCEL"
        description="Extract tabular data and numbers from PDF documents into Excel spreadsheets and CSV."
        onReset={reset}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={(files) => files[0] && handlePdf(files[0])}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          title="Upload PDF to extract tables"
          subtitle="Analyzes row & column coordinates to construct standard spreadsheet data."
        />
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">{file.name}</h4>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyCsv}
                disabled={!csvContent}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted disabled:opacity-40"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy CSV</span>
              </button>

              <button
                onClick={downloadCsv}
                disabled={!csvContent}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Excel (.CSV)</span>
              </button>

              <button
                onClick={reset}
                className="text-xs text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg"
              >
                Change PDF
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="font-bold text-xs uppercase text-foreground">
                Extracted Spreadsheet Grid ({extractedRows.length} rows)
              </span>
            </div>
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <tbody>
                  {extractedRows.slice(0, 100).map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx === 0 ? "bg-muted font-bold" : "border-b border-border/50"}
                    >
                      <td className="p-2 border-r border-border/50 text-[10px] text-muted-foreground w-12 text-center">
                        {rIdx + 1}
                      </td>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2.5 border-r border-border/50 whitespace-nowrap">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
