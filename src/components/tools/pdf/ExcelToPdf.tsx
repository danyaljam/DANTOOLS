"use client";

import * as React from "react";
import { Table, Download, Loader2, FileSpreadsheet } from "lucide-react";
import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";
import JSZip from "jszip";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { downloadBlob, formatBytes } from "@/lib/utils";

export function ExcelToPdf() {
  const [file, setFile] = React.useState<File | null>(null);
  const [tableData, setTableData] = React.useState<string[][]>([]);
  const [isConverting, setIsConverting] = React.useState(false);

  const handleFile = async (selected: File) => {
    setFile(selected);
    setIsConverting(true);
    setTableData([]);

    try {
      if (selected.name.endsWith(".csv") || selected.name.endsWith(".txt")) {
        const text = await selected.text();
        const rows = text
          .trim()
          .split(/\r?\n/)
          .map((row) => row.split(",").map((cell) => cell.trim().replace(/^["']|["']$/g, "")));
        setTableData(rows);
        toast.success(`Loaded ${rows.length} row(s) from CSV.`);
      } else {
        // Parse .xlsx sheet1.xml
        const zip = await JSZip.loadAsync(selected);
        const sharedStringsXml = await zip.file("xl/sharedStrings.xml")?.async("text");
        const sheetXml = await zip.file("xl/worksheets/sheet1.xml")?.async("text");

        if (!sheetXml) {
          throw new Error("Could not find sheet data inside XLSX file.");
        }

        const parser = new DOMParser();
        let stringTable: string[] = [];

        if (sharedStringsXml) {
          const sstDoc = parser.parseFromString(sharedStringsXml, "text/xml");
          stringTable = Array.from(sstDoc.getElementsByTagName("t")).map((t) => t.textContent || "");
        }

        const sheetDoc = parser.parseFromString(sheetXml, "text/xml");
        const rowNodes = Array.from(sheetDoc.getElementsByTagName("row"));
        const parsedRows: string[][] = [];

        for (const row of rowNodes) {
          const cells = Array.from(row.getElementsByTagName("c"));
          const rowVals: string[] = [];
          for (const cell of cells) {
            const isShared = cell.getAttribute("t") === "s";
            const valEl = cell.getElementsByTagName("v")[0];
            const rawVal = valEl?.textContent || "";
            if (isShared && stringTable[parseInt(rawVal, 10)] !== undefined) {
              rowVals.push(stringTable[parseInt(rawVal, 10)]);
            } else {
              rowVals.push(rawVal);
            }
          }
          if (rowVals.length) parsedRows.push(rowVals);
        }

        setTableData(parsedRows.length ? parsedRows : [["No data found"]]);
        toast.success(`Loaded ${parsedRows.length} row(s) from Excel spreadsheet.`);
      }
    } catch (err: any) {
      toast.error(`Could not read spreadsheet: ${err.message}`);
      setFile(null);
    } finally {
      setIsConverting(false);
    }
  };

  const exportPdf = async () => {
    if (!file || tableData.length === 0) return;
    setIsConverting(true);

    try {
      const pdfDoc = await PDFDocument.create();
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Landscape A4 (842 x 595) for tabular width
      const width = 842;
      const height = 595;
      const margin = 40;
      const maxTableWidth = width - margin * 2;

      const numCols = Math.max(...tableData.map((r) => r.length), 1);
      const colWidth = Math.min(180, maxTableWidth / numCols);
      const rowHeight = 22;

      let currentPage = pdfDoc.addPage([width, height]);
      let currentY = height - margin;

      // Document Title
      currentPage.drawText(file.name.replace(/\.[^/.]+$/, ""), {
        x: margin,
        y: currentY,
        size: 16,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      currentY -= 30;

      tableData.forEach((row, rowIdx) => {
        if (currentY < margin + rowHeight) {
          currentPage = pdfDoc.addPage([width, height]);
          currentY = height - margin;
        }

        const isHeader = rowIdx === 0;

        // Row background
        if (isHeader) {
          currentPage.drawRectangle({
            x: margin,
            y: currentY - 5,
            width: colWidth * numCols,
            height: rowHeight,
            color: rgb(0.9, 0.93, 0.98),
          });
        } else if (rowIdx % 2 === 1) {
          currentPage.drawRectangle({
            x: margin,
            y: currentY - 5,
            width: colWidth * numCols,
            height: rowHeight,
            color: rgb(0.98, 0.98, 0.99),
          });
        }

        // Draw cells
        row.forEach((cell, colIdx) => {
          const text = cell.length > 25 ? cell.substring(0, 22) + "..." : cell;
          currentPage.drawText(text, {
            x: margin + colIdx * colWidth + 6,
            y: currentY,
            size: isHeader ? 10 : 9,
            font: isHeader ? helveticaBold : helvetica,
            color: isHeader ? rgb(0.1, 0.2, 0.4) : rgb(0.2, 0.2, 0.2),
          });
        });

        // Bottom cell border line
        currentPage.drawLine({
          start: { x: margin, y: currentY - 5 },
          end: { x: margin + colWidth * numCols, y: currentY - 5 },
          thickness: 0.5,
          color: rgb(0.85, 0.85, 0.85),
        });

        currentY -= rowHeight;
      });

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      downloadBlob(blob, `${file.name.replace(/\.[^/.]+$/, "")}.pdf`);
      toast.success("Spreadsheet converted to PDF successfully!");
    } catch (err: any) {
      toast.error(`Export failed: ${err.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setTableData([]);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="PDF Utilities"
        title="EXCEL to PDF"
        description="Convert Excel (.xlsx) and CSV spreadsheets into formatted, clean landscape PDF tables."
        onReset={reset}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={(files) => files[0] && handleFile(files[0])}
          accept={{
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "text/csv": [".csv"],
          }}
          maxFiles={1}
          title="Upload Excel (.xlsx) or CSV"
          subtitle="Spreadsheet data is formatted into paginated vector PDF tables locally."
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

            <button
              onClick={reset}
              className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border"
            >
              Change File
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="font-bold text-xs uppercase text-foreground">
                Data Table Preview ({tableData.length} rows)
              </span>
            </div>
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <tbody>
                  {tableData.slice(0, 50).map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx === 0 ? "bg-muted font-bold" : "border-b border-border/50"}
                    >
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

          <div className="pt-2 flex justify-end">
            <button
              onClick={exportPdf}
              disabled={isConverting || tableData.length === 0}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all disabled:opacity-40"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Converting Table...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF Spreadsheet</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
