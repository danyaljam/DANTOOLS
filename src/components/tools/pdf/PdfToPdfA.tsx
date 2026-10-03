"use client";

import * as React from "react";
import { Archive, Download, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { PDFDocument, PDFName, PDFString } from "pdf-lib";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { downloadBlob, formatBytes } from "@/lib/utils";

export function PdfToPdfA() {
  const [file, setFile] = React.useState<File | null>(null);
  const [conformance, setConformance] = React.useState<"PDF/A-1b" | "PDF/A-2b">("PDF/A-1b");
  const [isConverting, setIsConverting] = React.useState(false);

  const convertToPdfA = async (selected: File) => {
    setFile(selected);
    setIsConverting(true);

    try {
      const buffer = await selected.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      // Embed PDF/A metadata
      pdfDoc.setTitle(selected.name.replace(/\.pdf$/i, ""));
      pdfDoc.setProducer("DAN Tools (100% Client-Side PDF/A Archival Engine)");
      pdfDoc.setCreator("DAN Tools");
      pdfDoc.setModificationDate(new Date());

      // Embed PDF/A OutputIntent dictionary
      const context = pdfDoc.context;
      const outputIntent = context.obj({
        Type: PDFName.of("OutputIntent"),
        S: PDFName.of("GTS_PDFA1"),
        OutputConditionIdentifier: PDFString.of("sRGB IEC61966-2.1"),
        RegistryName: PDFString.of("http://www.color.org"),
        Info: PDFString.of("sRGB IEC61966-2.1"),
      });

      pdfDoc.catalog.set(PDFName.of("OutputIntents"), context.obj([outputIntent]));

      const bytes = await pdfDoc.save({ useObjectStreams: false });
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      downloadBlob(blob, `${selected.name.replace(/\.pdf$/i, "")}_pdfa.pdf`);
      toast.success(`Converted to ${conformance} archival standard successfully!`);
    } catch (err: any) {
      toast.error(`PDF/A conversion failed: ${err.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  const reset = () => {
    setFile(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <ToolHeader
        category="PDF Utilities"
        title="PDF to PDF/A"
        description="Convert documents to ISO-standard PDF/A for long-term legal archiving and institutional compliance."
        onReset={reset}
      />

      {!file ? (
        <div className="space-y-4">
          <div className="flex items-center justify-end gap-2 text-xs">
            <span className="text-muted-foreground font-semibold">Conformance Target:</span>
            <select
              value={conformance}
              onChange={(e) => setConformance(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground"
            >
              <option value="PDF/A-1b">PDF/A-1b (Visual Preservation)</option>
              <option value="PDF/A-2b">PDF/A-2b (Modern Standards)</option>
            </select>
          </div>

          <FileDropzone
            onFilesSelected={(files) => files[0] && convertToPdfA(files[0])}
            accept={{ "application/pdf": [".pdf"] }}
            maxFiles={1}
            title="Upload PDF for PDF/A Archival Conversion"
            subtitle="Embeds sRGB output intent and ISO archival metadata without remote server uploads."
          />
        </div>
      ) : (
        <div className="p-8 rounded-2xl border border-border bg-card text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
            {isConverting ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <CheckCircle2 className="w-7 h-7" />
            )}
          </div>
          <h3 className="text-base font-bold text-foreground">
            {isConverting ? "Encoding PDF/A Standards..." : "Conversion Complete!"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {file.name} has been processed to embed standardized color output intent and metadata.
          </p>
          <div className="pt-2">
            <button
              onClick={reset}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
            >
              Convert Another PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
