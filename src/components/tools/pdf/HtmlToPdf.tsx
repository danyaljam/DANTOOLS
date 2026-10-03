"use client";

import * as React from "react";
import { Globe, Download, Printer, Code2, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ToolHeader } from "@/components/shared/ToolHeader";

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
    h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
    p { line-height: 1.6; font-size: 14px; margin-bottom: 16px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-top: 24px; }
    .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <span class="badge">Verified Document</span>
  <h1>Local HTML to PDF Conversion</h1>
  <p>This document is rendered 100% locally in your client browser. No external render servers or headless browsers are contacted.</p>
  <div class="card">
    <h3>Key Benefits</h3>
    <p>• Zero network transmission of sensitive documents<br>• Crisp vector typography output<br>• Full support for custom CSS, tables, and branding</p>
  </div>
</body>
</html>`;

export function HtmlToPdf() {
  const [htmlCode, setHtmlCode] = React.useState(DEFAULT_HTML);
  const [pageSize, setPageSize] = React.useState<"A4" | "Letter">("A4");
  const [orientation, setOrientation] = React.useState<"portrait" | "landscape">("portrait");
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const printPdf = () => {
    if (!iframeRef.current) return;
    const iframeWindow = iframeRef.current.contentWindow;
    if (iframeWindow) {
      iframeWindow.focus();
      iframeWindow.print();
      toast.success("Printing document / save as PDF prompt opened.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="PDF Utilities"
        title="HTML to PDF"
        description="Convert HTML code, styled templates, and web layouts into crisp vector PDF documents."
        onReset={() => setHtmlCode(DEFAULT_HTML)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Code Editor */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-primary" />
                HTML Source Code
              </span>

              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as any)}
                  className="px-2 py-1 rounded-lg border border-border text-xs bg-background"
                >
                  <option value="A4">A4 Size</option>
                  <option value="Letter">Letter Size</option>
                </select>

                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as any)}
                  className="px-2 py-1 rounded-lg border border-border text-xs bg-background"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>

            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              rows={20}
              className="w-full p-3.5 rounded-xl border border-border bg-background text-foreground font-mono text-xs leading-relaxed focus:ring-2 focus:ring-primary shadow-inner resize-y"
            />
          </div>

          <button
            onClick={printPdf}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Generate & Print / Save as PDF</span>
          </button>
        </div>

        {/* Right: Live Preview Iframe */}
        <div className="lg:col-span-6 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-primary" />
            Live Rendered Page
          </span>

          <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-md h-[550px]">
            <iframe
              ref={iframeRef}
              srcDoc={htmlCode}
              title="HTML PDF Preview"
              className="w-full h-full border-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
