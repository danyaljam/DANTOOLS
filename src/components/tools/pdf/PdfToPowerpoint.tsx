"use client";

import * as React from "react";
import { Presentation, Download, Loader2 } from "lucide-react";
import JSZip from "jszip";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { getPdfJs } from "@/lib/pdf-helpers";
import { downloadBlob, formatBytes } from "@/lib/utils";

interface PageSlide {
  pageNumber: number;
  title: string;
  bullets: string[];
}

export function PdfToPowerpoint() {
  const [file, setFile] = React.useState<File | null>(null);
  const [slides, setSlides] = React.useState<PageSlide[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handlePdf = async (selected: File) => {
    setFile(selected);
    setIsProcessing(true);
    setSlides([]);

    try {
      const pdfjs = await getPdfJs();
      const buffer = await selected.arrayBuffer();
      const pdfDoc = await pdfjs.getDocument({ data: buffer }).promise;
      const extracted: PageSlide[] = [];

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const rawStrings = textContent.items
          .map((item: any) => ("str" in item ? item.str.trim() : ""))
          .filter(Boolean);

        const title = rawStrings[0] || `Page ${i}`;
        const bullets = rawStrings.slice(1, 10);

        extracted.push({
          pageNumber: i,
          title,
          bullets: bullets.length ? bullets : ["Extracted page content"],
        });
      }

      setSlides(extracted);
      toast.success(`Converted ${pdfDoc.numPages} PDF page(s) into slides.`);
    } catch (err: any) {
      toast.error(`Could not read PDF: ${err.message}`);
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Generates a valid Microsoft PowerPoint .pptx package using JSZip
   */
  const exportPptx = async () => {
    if (!file || slides.length === 0) return;
    setIsProcessing(true);

    try {
      const zip = new JSZip();

      // [Content_Types].xml
      let overrides = slides
        .map(
          (_, idx) =>
            `<Override PartName="/ppt/slides/slide${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
        )
        .join("\n");

      zip.file(
        "[Content_Types].xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  ${overrides}
</Types>`
      );

      // _rels/.rels
      zip.file(
        "_rels/.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
      );

      // ppt/presentation.xml
      const sldIdList = slides
        .map((_, idx) => `<p:sldId id="${256 + idx}" r:id="rId${idx + 1}"/>`)
        .join("");

      zip.folder("ppt")?.file(
        "presentation.xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldMasterIdLst/>
  <p:sldIdLst>${sldIdList}</p:sldIdLst>
  <p:sldSz cx="9144000" cy="5143500"/>
</p:presentation>`
      );

      // ppt/_rels/presentation.xml.rels
      const presRels = slides
        .map(
          (_, idx) =>
            `<Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${idx + 1}.xml"/>`
        )
        .join("\n");

      zip.folder("ppt")?.folder("_rels")?.file(
        "presentation.xml.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${presRels}
</Relationships>`
      );

      // Individual slides in ppt/slides/slide{N}.xml
      const slidesFolder = zip.folder("ppt")?.folder("slides");
      slides.forEach((s) => {
        const bulletsXml = s.bullets
          .map(
            (b) =>
              `<a:p><a:r><a:rPr lang="en-US" sz="1800"/><a:t>${escapeXml(b)}</a:t></a:r></a:p>`
          )
          .join("");

        const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="457200" y="274320"/><a:ext cx="8229600" cy="1143000"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr/><a:p><a:r><a:rPr lang="en-US" b="1" sz="3200"/><a:t>${escapeXml(s.title)}</a:t></a:r></a:p></p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Content"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="457200" y="1600200"/><a:ext cx="8229600" cy="3200000"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr/>${bulletsXml}</p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

        slidesFolder?.file(`slide${s.pageNumber}.xml`, slideXml);
      });

      const blob = await zip.generateAsync({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      });

      downloadBlob(blob, `${file.name.replace(/\.pdf$/i, "")}.pptx`);
      toast.success("PowerPoint presentation (.pptx) downloaded!");
    } catch (err: any) {
      toast.error(`Export failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const escapeXml = (unsafe: string) => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "&": return "&amp;";
        case "'": return "&apos;";
        case '"': return "&quot;";
        default: return c;
      }
    });
  };

  const reset = () => {
    setFile(null);
    setSlides([]);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <ToolHeader
        category="PDF Utilities"
        title="PDF to POWERPOINT"
        description="Convert PDF document pages into editable Microsoft PowerPoint (.pptx) presentation slides."
        onReset={reset}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={(files) => files[0] && handlePdf(files[0])}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          title="Upload PDF to convert to PowerPoint"
          subtitle="Generates standard .pptx slide deck directly inside browser memory."
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
                key={s.pageNumber}
                className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-xs aspect-[16/9] flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">
                    Slide {s.pageNumber}
                  </span>
                  <h5 className="font-bold text-xs text-foreground truncate mt-1">{s.title}</h5>
                  <p className="text-[11px] text-muted-foreground line-clamp-3 mt-1">
                    {s.bullets.join(" • ")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={exportPptx}
              disabled={isProcessing || slides.length === 0}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Presentation...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PowerPoint (.pptx)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
