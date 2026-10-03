"use client";

import * as React from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { downloadBlob, downloadText } from "@/lib/utils";
import { toast } from "sonner";
import { AlignCenter, AlignLeft, AlignRight, Bold, Download, FileDown, Italic, List, Printer, Underline } from "lucide-react";

const INITIAL_DOCUMENT = "DAN Tools document\n\nStart writing here. Use the toolbar to format text, then download a DOC or PDF copy.";

export function DocumentEditor() {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [title, setTitle] = React.useState("Untitled document");
  const [wordCount, setWordCount] = React.useState(0);

  React.useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) editorRef.current.innerText = INITIAL_DOCUMENT;
    updateCount();
  }, []);

  const updateCount = () => {
    const text = editorRef.current?.innerText || "";
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
  };

  const command = (name: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(name, false, value);
    updateCount();
  };

  const documentText = () => editorRef.current?.innerText || "";

  const downloadDoc = () => {
    const content = editorRef.current?.innerHTML || "";
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${content}</body></html>`;
    downloadText(html, `${title || "document"}.doc`, "application/msword");
    toast.success("DOC file downloaded.");
  };

  const downloadPdf = async () => {
    try {
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      let page = pdf.addPage();
      let y = page.getHeight() - 54;
      const lines = documentText().split(/\r?\n/);
      lines.forEach((line) => {
        if (y < 54) { page = pdf.addPage(); y = page.getHeight() - 54; }
        page.drawText(line.slice(0, 110), { x: 54, y, size: line === title ? 18 : 11, font: line === title ? bold : font, color: rgb(0.08, 0.1, 0.14) });
        y -= line === title ? 28 : 18;
      });
      const bytes = await pdf.save();
      downloadBlob(new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }), `${title || "document"}.pdf`);
      toast.success("PDF file downloaded.");
    } catch (error) { toast.error(`Could not create PDF: ${(error as Error).message}`); }
  };

  const print = () => window.print();
  const reset = () => { setTitle("Untitled document"); if (editorRef.current) editorRef.current.innerText = INITIAL_DOCUMENT; updateCount(); };
  const toolButton = (label: string, icon: React.ReactNode, action: () => void) => <button type="button" onClick={action} title={label} aria-label={label} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">{icon}</button>;

  return <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
    <div className="print:hidden"><ToolHeader category="Writing & Documents" title="Document Editor" description="A focused, private document workspace with familiar formatting controls and DOC/PDF export." onReset={reset} actions={<><button onClick={downloadDoc} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold"><Download className="w-3.5 h-3.5" />DOC</button><button onClick={downloadPdf} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"><FileDown className="w-3.5 h-3.5" />PDF</button></>} /></div>
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 p-3 border-b border-border bg-muted/30 print:hidden">
        {toolButton("Bold", <Bold className="w-4 h-4" />, () => command("bold"))}{toolButton("Italic", <Italic className="w-4 h-4" />, () => command("italic"))}{toolButton("Underline", <Underline className="w-4 h-4" />, () => command("underline"))}<span className="w-px h-6 bg-border mx-1" />{toolButton("Align left", <AlignLeft className="w-4 h-4" />, () => command("justifyLeft"))}{toolButton("Align center", <AlignCenter className="w-4 h-4" />, () => command("justifyCenter"))}{toolButton("Align right", <AlignRight className="w-4 h-4" />, () => command("justifyRight"))}<span className="w-px h-6 bg-border mx-1" />{toolButton("Bullet list", <List className="w-4 h-4" />, () => command("insertUnorderedList"))}<select aria-label="Text style" onChange={(event) => command("formatBlock", event.target.value)} className="ml-auto px-2 py-1.5 rounded-lg border border-border bg-background text-xs"><option value="p">Paragraph</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="blockquote">Quote</option></select><button onClick={print} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold"><Printer className="w-3.5 h-3.5" />Print</button>
      </div>
      <div className="px-8 pt-7"><input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full text-2xl font-bold bg-transparent border-none outline-none text-foreground" aria-label="Document title" /></div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={updateCount} className="min-h-[560px] p-8 outline-none prose prose-sm dark:prose-invert max-w-none leading-7" role="textbox" aria-label="Document body" />
      <div className="px-5 py-2 border-t border-border bg-muted/20 text-[11px] text-muted-foreground print:hidden">{wordCount} words · Saved only in this browser tab</div>
    </div>
  </div>;
}
