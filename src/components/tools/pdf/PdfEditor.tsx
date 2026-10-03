"use client";

import * as React from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { renderPdfThumbnails, RenderedPageInfo } from "@/lib/pdf-helpers";
import { downloadBlob, formatBytes } from "@/lib/utils";
import { toast } from "sonner";
import {
  Download,
  Edit3,
  Highlighter,
  ImagePlus,
  Loader2,
  Move,
  Paintbrush2,
  Plus,
  Trash2,
  Type,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

type EditorMode = "select" | "text" | "highlight" | "draw" | "image";
type Point = { x: number; y: number };
type TextAnnotation = { id: string; type: "text"; x: number; y: number; width: number; height: number; value: string; size: number; color: string };
type HighlightAnnotation = { id: string; type: "highlight"; x: number; y: number; width: number; height: number; color: string };
type DrawAnnotation = { id: string; type: "draw"; points: Point[]; color: string };
type ImageAnnotation = { id: string; type: "image"; x: number; y: number; width: number; height: number; src: string };
type Annotation = TextAnnotation | HighlightAnnotation | DrawAnnotation | ImageAnnotation;

type DragState = { id: string; startX: number; startY: number; originalX: number; originalY: number };

type DrawingState = { start: Point; end: Point };

type DraftState = {
  draw: Point[] | null;
  highlight: DrawingState | null;
};

const PAGE_VIEW_WIDTH = 1000;
const DEFAULT_TEXT_COLOR = "#2563eb";
const DEFAULT_HIGHLIGHT_COLOR = "#facc15";
const DEFAULT_DRAW_COLOR = "#dc2626";

export function PdfEditor() {
  const [file, setFile] = React.useState<File | null>(null);
  const [pages, setPages] = React.useState<RenderedPageInfo[]>([]);
  const [selectedPage, setSelectedPage] = React.useState(1);
  const [mode, setMode] = React.useState<EditorMode>("select");
  const [text, setText] = React.useState("Add text");
  const [fontSize, setFontSize] = React.useState(18);
  const [annotationColor, setAnnotationColor] = React.useState(DEFAULT_TEXT_COLOR);
  const [highlightColor, setHighlightColor] = React.useState(DEFAULT_HIGHLIGHT_COLOR);
  const [drawColor, setDrawColor] = React.useState(DEFAULT_DRAW_COLOR);
  const [annotations, setAnnotations] = React.useState<Annotation[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);
  const [draft, setDraft] = React.useState<DraftState>({ draw: null, highlight: null });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragState, setDragState] = React.useState<DragState | null>(null);
  const pageRef = React.useRef<HTMLDivElement | null>(null);
  const imageInputRef = React.useRef<HTMLInputElement | null>(null);

  const currentPage = pages.find((page) => page.pageNumber === selectedPage);
  const pageAnnotations = annotations.filter((annotation) => annotation.id.startsWith(`${selectedPage}-`));
  const selectedAnnotation = annotations.find((annotation) => annotation.id === selectedId) || null;

  const loadFile = async (files: File[]) => {
    const selected = files[0];
    if (!selected) return;
    try {
      const rendered = await renderPdfThumbnails(selected, 50, 0.9);
      setFile(selected);
      setPages(rendered);
      setSelectedPage(1);
      setAnnotations([]);
      setSelectedId(null);
      setZoom(1);
      toast.success(`Loaded ${rendered.length} page(s) for editing.`);
    } catch (error) {
      toast.error(`Could not open PDF: ${(error as Error).message}`);
    }
  };

  const getPointFromEvent = (event: React.PointerEvent<HTMLDivElement>): Point => {
    if (!pageRef.current || !currentPage) return { x: 0, y: 0 };
    const rect = pageRef.current.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * PAGE_VIEW_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * currentPage.height,
    };
  };

  const addAnnotation = (annotation: Annotation) => {
    setAnnotations((previous) => [...previous, annotation]);
    setSelectedId(annotation.id);
  };

  const handlePagePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const point = getPointFromEvent(event);

    if (mode === "select") {
      setSelectedId(null);
      return;
    }

    if (mode === "text") {
      const newAnnotation: TextAnnotation = {
        id: makeId(selectedPage),
        type: "text",
        x: point.x,
        y: point.y,
        width: 180,
        height: 32,
        value: text || "Add text",
        size: fontSize,
        color: annotationColor,
      };
      addAnnotation(newAnnotation);
      setMode("select");
      return;
    }

    if (mode === "image") {
      imageInputRef.current?.click();
      return;
    }

    if (mode === "draw") {
      setDraft((previous) => ({ ...previous, draw: [point] }));
      return;
    }

    setDraft((previous) => ({ ...previous, highlight: { start: point, end: point } }));
  };

  const handlePagePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!selectedId || mode !== "select") {
      if (mode === "draw" && draft.draw) {
        const point = getPointFromEvent(event);
        setDraft((previous) => ({ ...previous, draw: previous.draw ? [...previous.draw, point] : [point] }));
      }
      if (mode === "highlight" && draft.highlight) {
        const point = getPointFromEvent(event);
        setDraft((previous) => ({ ...previous, highlight: previous.highlight ? { ...previous.highlight, end: point } : { start: point, end: point } }));
      }
      return;
    }

    if (isDragging && dragState) {
      const point = getPointFromEvent(event);
      const deltaX = point.x - dragState.startX;
      const deltaY = point.y - dragState.startY;
      setAnnotations((previous) => previous.map((annotation) => {
        if (annotation.id !== dragState.id) return annotation;
        if (annotation.type === "draw") return annotation;
        const nextX = clamp(annotation.x + deltaX, 0, PAGE_VIEW_WIDTH - annotation.width);
        const nextY = clamp(annotation.y + deltaY, 0, currentPage?.height || PAGE_VIEW_WIDTH - annotation.height);
        return { ...annotation, x: nextX, y: nextY };
      }));
      setDragState({ ...dragState, startX: point.x, startY: point.y, originalX: dragState.originalX, originalY: dragState.originalY });
    }
  };

  const handlePagePointerUp = () => {
    if (mode === "draw" && draft.draw && draft.draw.length > 1) {
      addAnnotation({ id: makeId(selectedPage), type: "draw", points: draft.draw, color: drawColor });
    }

    if (mode === "highlight" && draft.highlight) {
      const { start, end } = draft.highlight;
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      if (width > 5 && height > 5) {
        addAnnotation({ id: makeId(selectedPage), type: "highlight", x, y, width, height, color: highlightColor });
      }
    }

    setDraft({ draw: null, highlight: null });
    setIsDragging(false);
    setDragState(null);
  };

  const handleOverlayPointerDown = (event: React.PointerEvent<HTMLDivElement>, annotation: Annotation) => {
    event.stopPropagation();
    if (mode !== "select") return;
    if (annotation.type === "draw") return;
    setSelectedId(annotation.id);
    setIsDragging(true);
    const point = getPointFromEvent(event);
    setDragState({ id: annotation.id, startX: point.x, startY: point.y, originalX: annotation.x, originalY: annotation.y });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = event.target.files?.[0];
    if (!uploaded) return;
    const dataUrl = await fileToDataUrl(uploaded);
    const imageAnnotation: ImageAnnotation = {
      id: makeId(selectedPage),
      type: "image",
      x: 180,
      y: 180,
      width: 180,
      height: 140,
      src: dataUrl,
    };
    addAnnotation(imageAnnotation);
    setMode("select");
    event.target.value = "";
  };

  const removeSelectedAnnotation = () => {
    if (!selectedId) return;
    setAnnotations((previous) => previous.filter((annotation) => annotation.id !== selectedId));
    setSelectedId(null);
  };

  const clearPage = () => {
    setAnnotations((previous) => previous.filter((annotation) => !annotation.id.startsWith(`${selectedPage}-`)));
    setSelectedId(null);
  };

  const exportPdf = async () => {
    if (!file) return;
    setIsExporting(true);
    try {
      const source = await PDFDocument.load(await file.arrayBuffer());
      const font = await source.embedFont(StandardFonts.Helvetica);

      for (const page of source.getPages()) {
        const pageNumber = source.getPages().indexOf(page) + 1;
        const pageObjects = annotations.filter((annotation) => annotation.id.startsWith(`${pageNumber}-`));
        const { width, height } = page.getSize();
        const scaleX = width / PAGE_VIEW_WIDTH;
        const scaleY = height / (pages[pageNumber - 1]?.height || 1400);

        for (const annotation of pageObjects) {
          if (annotation.type === "text") {
            page.drawText(annotation.value, {
              x: annotation.x * scaleX,
              y: height - annotation.y * scaleY - annotation.size * scaleY,
              size: annotation.size * scaleY,
              font,
              color: hexToPdfColor(annotation.color),
            });
          }

          if (annotation.type === "highlight") {
            page.drawRectangle({
              x: annotation.x * scaleX,
              y: height - (annotation.y + annotation.height) * scaleY,
              width: annotation.width * scaleX,
              height: annotation.height * scaleY,
              color: hexToPdfColor(annotation.color),
              opacity: 0.35,
            });
          }

          if (annotation.type === "draw") {
            for (let index = 1; index < annotation.points.length; index += 1) {
              const start = annotation.points[index - 1];
              const end = annotation.points[index];
              page.drawLine({
                start: { x: start.x * scaleX, y: height - start.y * scaleY },
                end: { x: end.x * scaleX, y: height - end.y * scaleY },
                thickness: 2,
                color: hexToPdfColor(annotation.color),
              });
            }
          }

          if (annotation.type === "image") {
            const imageBytes = decodeDataUrl(annotation.src);
            const embedded = annotation.src.toLowerCase().includes("png") ? await source.embedPng(imageBytes) : await source.embedJpg(imageBytes);
            page.drawImage(embedded, {
              x: annotation.x * scaleX,
              y: height - (annotation.y + annotation.height) * scaleY,
              width: annotation.width * scaleX,
              height: annotation.height * scaleY,
            });
          }
        }
      }

      const bytes = await source.save({ useObjectStreams: true });
      downloadBlob(new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }), `edited_${file.name}`);
      toast.success("Edited PDF downloaded.");
    } catch (error) {
      toast.error(`Export failed: ${(error as Error).message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPages([]);
    setAnnotations([]);
    setSelectedId(null);
    setSelectedPage(1);
    setZoom(1);
  };

  const selectedText = selectedAnnotation && selectedAnnotation.type === "text" ? selectedAnnotation : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-8xl mx-auto w-full">
      <ToolHeader
        category="PDF Utilities"
        title="PDF Editor"
        description="A full PDF editor with text boxes, image insertion, highlight tools, and pointer-driven positioning like Microsoft Edge."
        onReset={reset}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={loadFile}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          title="Upload a PDF to edit"
          subtitle="Add text, images, highlights, and notes without uploading the document to a server."
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)_300px] gap-5">
          <aside className="rounded-2xl border border-border bg-card p-3 space-y-3 max-h-[720px] overflow-y-auto">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span className="truncate">{file.name}</span>
              <span className="text-muted-foreground">{formatBytes(file.size)}</span>
            </div>

            {pages.map((page) => (
              <button
                key={page.pageNumber}
                onClick={() => setSelectedPage(page.pageNumber)}
                className={`w-full p-2 rounded-xl border text-left ${selectedPage === page.pageNumber ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}
              >
                <img src={page.dataUrl} alt={`Page ${page.pageNumber}`} className="w-full rounded-md bg-white" />
                <span className="text-[11px] text-muted-foreground">Page {page.pageNumber}</span>
              </button>
            ))}
          </aside>

          <section className="rounded-2xl border border-border bg-muted/30 p-4 min-h-[600px] overflow-auto">
            {currentPage && (
              <div className="flex min-h-[560px] items-center justify-center">
                <div className="relative rounded-xl border border-border bg-white shadow-xl" style={{ width: `${PAGE_VIEW_WIDTH * zoom}px`, maxWidth: "100%" }}>
                  <img src={currentPage.dataUrl} alt={`Editing page ${selectedPage}`} className="block w-full h-auto" draggable={false} />

                  <div
                    ref={pageRef}
                    className="absolute inset-0"
                    onPointerDown={handlePagePointerDown}
                    onPointerMove={handlePagePointerMove}
                    onPointerUp={handlePagePointerUp}
                    onPointerLeave={handlePagePointerUp}
                    onPointerCancel={handlePagePointerUp}
                    style={{ cursor: mode === "select" ? "default" : mode === "text" ? "crosshair" : "crosshair" }}
                  >
                    {pageAnnotations.map((annotation) => {
                      const isSelected = selectedId === annotation.id;

                      if (annotation.type === "text") {
                        return (
                          <div
                            key={annotation.id}
                            onPointerDown={(event) => handleOverlayPointerDown(event, annotation)}
                            className={`absolute flex items-center justify-center rounded-md border ${isSelected ? "border-primary border-2" : "border-transparent"}`}
                            style={{
                              left: `${(annotation.x / PAGE_VIEW_WIDTH) * 100}%`,
                              top: `${(annotation.y / currentPage.height) * 100}%`,
                              width: `${(annotation.width / PAGE_VIEW_WIDTH) * 100}%`,
                              height: `${(annotation.height / currentPage.height) * 100}%`,
                              color: annotation.color,
                              fontSize: `${annotation.size}px`,
                              fontWeight: 600,
                              background: isSelected ? "rgba(37, 99, 235, 0.04)" : "transparent",
                              pointerEvents: mode === "select" ? "auto" : "none",
                            }}
                          >
                            {annotation.value}
                          </div>
                        );
                      }

                      if (annotation.type === "highlight") {
                        return (
                          <div
                            key={annotation.id}
                            onPointerDown={(event) => handleOverlayPointerDown(event, annotation)}
                            className={`absolute rounded-sm ${isSelected ? "ring-2 ring-primary/60" : ""}`}
                            style={{
                              left: `${(annotation.x / PAGE_VIEW_WIDTH) * 100}%`,
                              top: `${(annotation.y / currentPage.height) * 100}%`,
                              width: `${(annotation.width / PAGE_VIEW_WIDTH) * 100}%`,
                              height: `${(annotation.height / currentPage.height) * 100}%`,
                              background: annotation.color,
                              opacity: 0.35,
                              pointerEvents: mode === "select" ? "auto" : "none",
                            }}
                          />
                        );
                      }

                      if (annotation.type === "draw") {
                        return (
                          <svg
                            key={annotation.id}
                            className="absolute inset-0 h-full w-full"
                            preserveAspectRatio="none"
                            style={{ pointerEvents: "none" }}
                          >
                            <polyline
                              points={annotation.points.map((point) => `${(point.x / PAGE_VIEW_WIDTH) * 100},${(point.y / currentPage.height) * 100}`).join(" ")}
                              fill="none"
                              stroke={annotation.color}
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        );
                      }

                      return (
                        <div
                          key={annotation.id}
                          onPointerDown={(event) => handleOverlayPointerDown(event, annotation)}
                          className={`absolute rounded-md border ${isSelected ? "border-primary border-2" : "border-transparent"}`}
                          style={{
                            left: `${(annotation.x / PAGE_VIEW_WIDTH) * 100}%`,
                            top: `${(annotation.y / currentPage.height) * 100}%`,
                            width: `${(annotation.width / PAGE_VIEW_WIDTH) * 100}%`,
                            height: `${(annotation.height / currentPage.height) * 100}%`,
                            overflow: "hidden",
                            background: "white",
                            pointerEvents: mode === "select" ? "auto" : "none",
                          }}
                        >
                          <img src={annotation.src} alt="Inserted image" className="h-full w-full object-cover" draggable={false} />
                        </div>
                      );
                    })}

                    {draft.draw && (
                      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" style={{ pointerEvents: "none" }}>
                        <polyline
                          points={draft.draw.map((point) => `${(point.x / PAGE_VIEW_WIDTH) * 100},${(point.y / currentPage.height) * 100}`).join(" ")}
                          fill="none"
                          stroke={drawColor}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}

                    {draft.highlight && (
                      <div
                        className="absolute rounded-sm"
                        style={{
                          left: `${(Math.min(draft.highlight.start.x, draft.highlight.end.x) / PAGE_VIEW_WIDTH) * 100}%`,
                          top: `${(Math.min(draft.highlight.start.y, draft.highlight.end.y) / currentPage.height) * 100}%`,
                          width: `${(Math.abs(draft.highlight.end.x - draft.highlight.start.x) / PAGE_VIEW_WIDTH) * 100}%`,
                          height: `${(Math.abs(draft.highlight.end.y - draft.highlight.start.y) / currentPage.height) * 100}%`,
                          background: highlightColor,
                          opacity: 0.35,
                          pointerEvents: "none",
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className="rounded-2xl border border-border bg-card p-4 space-y-5 h-fit">
            <div>
              <h2 className="text-sm font-bold">Editing tools</h2>
              <p className="text-xs text-muted-foreground mt-1">Select a tool, place content on the page, and drag if needed.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {([
                ["select", Move],
                ["text", Type],
                ["highlight", Highlighter],
                ["draw", Paintbrush2],
                ["image", ImagePlus],
              ] as const).map(([tool, Icon]) => (
                <button
                  key={tool}
                  onClick={() => setMode(tool)}
                  className={`p-2 rounded-xl border text-xs font-semibold capitalize ${mode === tool ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}
                >
                  <Icon className="w-4 h-4 mx-auto mb-1" />
                  {tool}
                </button>
              ))}
            </div>

            {selectedText && (
              <div className="space-y-3 border border-border rounded-xl p-3 bg-muted/30">
                <label className="text-xs font-semibold block">
                  Text
                  <textarea value={selectedText.value} onChange={(event) => {
                    setAnnotations((previous) => previous.map((annotation) => annotation.id === selectedText.id ? { ...annotation, value: event.target.value } : annotation));
                  }} rows={3} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                </label>
                <label className="text-xs font-semibold block">
                  Font size: {selectedText.size}px
                  <input type="range" min="12" max="48" value={selectedText.size} onChange={(event) => {
                    const nextSize = Number(event.target.value);
                    setAnnotations((previous) => previous.map((annotation) => annotation.id === selectedText.id ? { ...annotation, size: nextSize } : annotation));
                  }} className="mt-1 w-full accent-primary" />
                </label>
                <label className="text-xs font-semibold block">
                  Text color
                  <input type="color" value={selectedText.color} onChange={(event) => {
                    const nextColor = event.target.value;
                    setAnnotations((previous) => previous.map((annotation) => annotation.id === selectedText.id ? { ...annotation, color: nextColor } : annotation));
                  }} className="mt-1 h-10 w-full rounded-lg border border-border bg-background p-1" />
                </label>
              </div>
            )}

            {mode === "text" && !selectedText && (
              <div className="space-y-3 border border-border rounded-xl p-3 bg-muted/30">
                <label className="text-xs font-semibold block">
                  Default text
                  <input value={text} onChange={(event) => setText(event.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                </label>
                <label className="text-xs font-semibold block">
                  Font size: {fontSize}px
                  <input type="range" min="12" max="48" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} className="mt-1 w-full accent-primary" />
                </label>
                <label className="text-xs font-semibold block">
                  Text color
                  <input type="color" value={annotationColor} onChange={(event) => setAnnotationColor(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-background p-1" />
                </label>
              </div>
            )}

            {mode === "highlight" && (
              <label className="text-xs font-semibold block">
                Highlight color
                <input type="color" value={highlightColor} onChange={(event) => setHighlightColor(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-background p-1" />
              </label>
            )}

            {mode === "draw" && (
              <label className="text-xs font-semibold block">
                Pen color
                <input type="color" value={drawColor} onChange={(event) => setDrawColor(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-background p-1" />
              </label>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setZoom((value) => Math.max(0.7, Number((value - 0.1).toFixed(1))))} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-semibold"><ZoomOut className="w-4 h-4" />Zoom</button>
              <button onClick={() => setZoom((value) => Math.min(2.5, Number((value + 0.1).toFixed(1))))} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-semibold"><ZoomIn className="w-4 h-4" />Zoom</button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={removeSelectedAnnotation} disabled={!selectedId} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-semibold disabled:opacity-40"><Trash2 className="w-4 h-4" />Delete</button>
              <button onClick={clearPage} disabled={!pageAnnotations.length} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-semibold disabled:opacity-40"><Plus className="w-4 h-4 rotate-45" />Clear</button>
            </div>

            <button onClick={exportPdf} disabled={isExporting || !file} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-60">
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download edited PDF
            </button>

            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

            <div className="text-[11px] text-muted-foreground flex items-start gap-2">
              <Edit3 className="w-4 h-4 shrink-0 text-primary" />
              Drag any selected object to reposition it on the page. This editor is built for smooth interactive use rather than heavy repeated rerenders.
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function makeId(pageNumber: number) {
  return `${pageNumber}-${Math.random().toString(36).slice(2, 10)}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

function decodeDataUrl(dataUrl: string) {
  const match = /^data:(image\/(png|jpeg));base64,(.+)$/i.exec(dataUrl);
  if (!match || !match[3]) throw new Error("Unsupported image format.");
  const binary = atob(match[3]);
  const output = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) output[index] = binary.charCodeAt(index);
  return output;
}

function hexToPdfColor(value: string) {
  const cleaned = value.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return rgb(0, 0, 0);
  const hex = cleaned.length === 3 ? cleaned.split("").map((char) => char + char).join("") : cleaned;
  const red = Number.parseInt(hex.slice(0, 2), 16) / 255;
  const green = Number.parseInt(hex.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(hex.slice(4, 6), 16) / 255;
  return rgb(red, green, blue);
}
