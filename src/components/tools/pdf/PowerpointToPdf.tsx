"use client";

import * as React from "react";
import { Presentation, Download, Loader2 } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { downloadBlob, formatBytes } from "@/lib/utils";

interface SlideData {
  slideNumber: number;
  texts: string[];
}

export function PowerpointToPdf() {
  const [file, setFile] = React.useState<File | null>(null);
  const [slides, setSlides] = React.useState<SlideData[]>([]);
  const [isConverting, setIsConverting] = React.useState(false);

  const handlePptx = async (selected: File) => {
    setFile(selected);
    setIsConverting(true);
    setSlides([]);

    try {
      const zip = await JSZip.loadAsync(selected);
      const slideFiles = Object.keys(zip.files)
        .filter((name) => name.startsWith("ppt/slides/slide") && name.endsWith(".xml"))
        .sort((a, b) => {
          const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
          const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
          return numA - numB;
        });

      if (slideFiles.length === 0) {
        throw new Error("No slide XML files found inside PPTX package.");
      }

      const extractedSlides: SlideData[] = [];
      const parser = new DOMParser();

      for (let i = 0; i < slideFiles.length; i++) {
        const slideXml = await zip.files[slideFiles[i]].async("text");
        const xmlDoc = parser.parseFromString(slideXml, "text/xml");
        const textElements = Array.from(xmlDoc.getElementsByTagName("a:t"));
        const texts = textElements
          .map((el) => el.textContent?.trim() || "")
          .filter(Boolean);

        extractedSlides.push({
          slideNumber: i + 1,
          texts: texts.length ? texts : ["(Empty Slide)"],
        });
      }

      setSlides(extractedSlides);
      toast.success(`Loaded ${extractedSlides.length} slide(s) from presentation.`);
    } catch (err: any) {
      toast.error(`Could not read PowerPoint file: ${err.message}`);
      setFile(null);
    } finally {
      setIsConverting(false);
    }
  };

  const exportPdf = async () => {
    if (!file || slides.length === 0) return;
    setIsConverting(true);

    try {
      const pdfDoc = await PDFDocument.create();
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // 16:9 Landscape dimensions (842 x 474 pt)
      const width = 842;
      const height = 474;

      for (const slide of slides) {
        const page = pdfDoc.addPage([width, height]);
        // Slide background
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: rgb(0.98, 0.98, 0.99),
        });

        // Top accent line
        page.drawRectangle({
          x: 0,
          y: height - 6,
          width,
          height: 6,
          color: rgb(0.95, 0.35, 0.15),
        });

        // Slide number
        page.drawText(`Slide ${slide.slideNumber}`, {
          x: width - 80,
          y: 20,
          size: 10,
          font: helvetica,
          color: rgb(0.5, 0.5, 0.5),
        });

        let currentY = height - 60;
        const title = slide.texts[0] || `Slide ${slide.slideNumber}`;
        page.drawText(title, {
          x: 50,
          y: currentY,
          size: 20,
          font: helveticaBold,
          color: rgb(0.1, 0.1, 0.1),
        });
        currentY -= 40;

        // Content bullet points
        const bodyLines = slide.texts.slice(1);
        for (const item of bodyLines) {
          if (currentY < 40) break;
          page.drawText(`•  ${item}`, {
            x: 60,
            y: currentY,
            size: 13,
            font: helvetica,
            color: rgb(0.2, 0.2, 0.2),
          });
          currentY -= 24;
        }
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      downloadBlob(blob, `${file.name.replace(/\.pptx$/i, "")}.pdf`);
      toast.success("PowerPoint presentation converted to PDF successfully!");
    } catch (err: any) {
      toast.error(`Export failed: ${err.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setSlides([]);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <ToolHeader
        category="PDF Utilities"
        title="POWERPOINT to PDF"
        description="Convert Microsoft PowerPoint (.pptx) slides into formatted 16:9 PDF presentations."
        onReset={reset}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={(files) => files[0] && handlePptx(files[0])}
          accept={{
            "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
          }}
          maxFiles={1}
          title="Upload PowerPoint (.pptx) slides"
          subtitle="Slide titles, bullet points, and deck structure are formatted client-side."
        />
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
                <Presentation className="w-5 h-5" />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {slides.map((s) => (
              <div
                key={s.slideNumber}
                className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-xs aspect-[16/9] flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">
                    Slide {s.slideNumber}
                  </span>
                  <h5 className="font-bold text-xs text-foreground truncate mt-1">
                    {s.texts[0] || "(Untitled)"}
                  </h5>
                  <p className="text-[11px] text-muted-foreground line-clamp-3 mt-1">
                    {s.texts.slice(1).join(" · ")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={exportPdf}
              disabled={isConverting || slides.length === 0}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all disabled:opacity-40"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Converting Slides...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF Presentation ({slides.length} slides)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
