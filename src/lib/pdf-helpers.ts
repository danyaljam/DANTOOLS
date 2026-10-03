/**
 * PDF helper functions for rendering thumbnails and extracting pages
 * Designed to run 100% in the browser
 */

export async function getPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
  return pdfjs;
}

export interface RenderedPageInfo {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Render all pages of a PDF File into thumbnail data URLs
 */
export async function renderPdfThumbnails(
  file: File | ArrayBuffer,
  maxPages = 30,
  scale = 0.5
): Promise<RenderedPageInfo[]> {
  const pdfjs = await getPdfJs();
  const data = file instanceof File ? await file.arrayBuffer() : file;
  const loadingTask = pdfjs.getDocument({ data });
  const pdfDoc = await loadingTask.promise;

  const numPages = Math.min(pdfDoc.numPages, maxPages);
  const thumbnails: RenderedPageInfo[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvas,
      canvasContext: ctx,
      viewport,
    }).promise;

    thumbnails.push({
      pageNumber: i,
      dataUrl: canvas.toDataURL("image/jpeg", 0.8),
      width: viewport.width,
      height: viewport.height,
    });
  }

  return thumbnails;
}

/**
 * Parse page range string like "1-3, 5, 8-10" into sorted array of 1-based page numbers
 */
export function parsePageRanges(input: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = input.split(",").map((p) => p.trim());

  for (const part of parts) {
    if (!part) continue;
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-").map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let i = from; i <= to; i++) {
          pages.add(i);
        }
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        pages.add(num);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

