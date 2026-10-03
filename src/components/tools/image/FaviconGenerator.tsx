"use client";

import * as React from "react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { FileDropzone } from "@/components/shared/FileDropzone";
import JSZip from "jszip";
import { toast } from "sonner";
import {
  Layers,
  Download,
  Loader2,
  Copy,
  Check,
  Code2,
  FileCheck,
  CheckCircle2,
} from "lucide-react";
import { downloadBlob } from "@/lib/utils";

interface IconSize {
  name: string;
  size: number;
  dataUrl?: string;
  blob?: Blob;
}

const ICON_SIZES: Omit<IconSize, "dataUrl" | "blob">[] = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "favicon-48x48.png", size: 48 },
  { name: "favicon-64x64.png", size: 64 },
  { name: "favicon-128x128.png", size: 128 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "android-chrome-192x192.png", size: 192 },
  { name: "android-chrome-512x512.png", size: 512 },
];

export function FaviconGenerator() {
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [generatedIcons, setGeneratedIcons] = React.useState<IconSize[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [copiedHtml, setCopiedHtml] = React.useState(false);

  const handleFileAdded = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);

    generateAllSizes(url);
  };

  const generateAllSizes = async (imageUrl: string) => {
    setIsGenerating(true);
    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      const results: IconSize[] = [];

      for (const spec of ICON_SIZES) {
        const canvas = document.createElement("canvas");
        canvas.width = spec.size;
        canvas.height = spec.size;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        ctx.imageSmoothingQuality = "high";
        // Center crop / fit square
        const minDim = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - minDim) / 2;
        const sy = (img.naturalHeight - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, spec.size, spec.size);

        const dataUrl = canvas.toDataURL("image/png");
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));

        results.push({
          ...spec,
          dataUrl,
          blob,
        });
      }

      setGeneratedIcons(results);
      toast.success("Generated all standard favicon & app icon sizes!");
    } catch (err: any) {
      toast.error("Failed to generate icons: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Builds a multi-resolution Windows .ICO binary from 16x16 and 32x32 PNG blobs
   */
  const buildIcoBlob = async (icons: IconSize[]): Promise<Blob> => {
    const icoSizes = icons.filter((i) => i.size === 16 || i.size === 32 || i.size === 48);
    const pngBuffers: ArrayBuffer[] = [];

    for (const item of icoSizes) {
      if (item.blob) {
        const buf = await item.blob.arrayBuffer();
        pngBuffers.push(buf);
      }
    }

    const numIcons = pngBuffers.length;
    const headerSize = 6;
    const directoryEntrySize = 16;
    let offset = headerSize + numIcons * directoryEntrySize;

    // Compute total buffer size
    const totalBytes = offset + pngBuffers.reduce((sum, buf) => sum + buf.byteLength, 0);
    const icoArray = new Uint8Array(totalBytes);
    const view = new DataView(icoArray.buffer);

    // Write ICONDIR
    view.setUint16(0, 0, true); // Reserved
    view.setUint16(2, 1, true); // Type: 1 = ICO
    view.setUint16(4, numIcons, true); // Number of images

    // Write ICONDIRENTRY for each
    for (let i = 0; i < numIcons; i++) {
      const size = icoSizes[i].size;
      const pngBuf = pngBuffers[i];
      const entryPos = headerSize + i * directoryEntrySize;

      icoArray[entryPos + 0] = size >= 256 ? 0 : size; // Width
      icoArray[entryPos + 1] = size >= 256 ? 0 : size; // Height
      icoArray[entryPos + 2] = 0; // Color count
      icoArray[entryPos + 3] = 0; // Reserved
      view.setUint16(entryPos + 4, 1, true); // Color planes
      view.setUint16(entryPos + 6, 32, true); // Bits per pixel
      view.setUint32(entryPos + 8, pngBuf.byteLength, true); // Bytes in resource
      view.setUint32(entryPos + 12, offset, true); // Offset

      // Copy PNG data
      icoArray.set(new Uint8Array(pngBuf), offset);
      offset += pngBuf.byteLength;
    }

    return new Blob([icoArray], { type: "image/x-icon" });
  };

  const downloadBundleZip = async () => {
    if (generatedIcons.length === 0) return;
    try {
      const zip = new JSZip();

      // Add all PNG files
      for (const icon of generatedIcons) {
        if (icon.blob) {
          zip.file(icon.name, icon.blob);
        }
      }

      // Add binary favicon.ico
      const icoBlob = await buildIcoBlob(generatedIcons);
      zip.file("favicon.ico", icoBlob);

      // Add webmanifest
      const manifest = {
        name: "My App",
        short_name: "App",
        icons: [
          { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
        ],
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
      };
      zip.file("site.webmanifest", JSON.stringify(manifest, null, 2));

      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, "favicon_package.zip");
      toast.success("Favicon package (.ico + PNGs + manifest) downloaded!");
    } catch (err: any) {
      toast.error("Failed to package ZIP: " + err.message);
    }
  };

  const htmlCodeSnippet = `<!-- Favicon & App Icons generated by LocalTools -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;

  const copyHtml = () => {
    navigator.clipboard.writeText(htmlCodeSnippet);
    setCopiedHtml(true);
    toast.success("HTML tags copied to clipboard!");
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const resetAll = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setGeneratedIcons([]);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="Image & Graphics"
        title="Favicon & App Icon Generator"
        description="Transform 1 image into a complete .ico and multi-resolution PNG ZIP package for web, iOS, and Android."
        onReset={resetAll}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileAdded}
          accept={{ "image/*": [".png", ".jpg", ".jpeg", ".svg", ".webp"] }}
          maxFiles={1}
          title="Upload logo or icon image"
          subtitle="Square PNG or SVG recommended (at least 512x512 for optimal sharpness)."
        />
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">{file.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {generatedIcons.length} icon formats generated
                </p>
              </div>
            </div>

            <button
              onClick={resetAll}
              className="text-xs text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg"
            >
              Change Logo
            </button>
          </div>

          {/* Generated Sizes Grid */}
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Generated Icon Formats</h3>
              <button
                onClick={downloadBundleZip}
                disabled={isGenerating || generatedIcons.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-md hover:bg-primary/90 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Everything (.ZIP)</span>
              </button>
            </div>

            {isGenerating ? (
              <div className="p-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs">Generating icon resolutions...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {generatedIcons.map((item) => (
                  <div
                    key={item.name}
                    className="p-3 rounded-xl border border-border bg-muted/20 flex flex-col items-center text-center space-y-2"
                  >
                    <div className="w-14 h-14 rounded-lg bg-card border border-border/80 flex items-center justify-center p-1.5 shadow-xs">
                      {item.dataUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.dataUrl}
                          alt={item.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      )}
                    </div>
                    <span className="text-xs font-bold text-foreground">{item.size}×{item.size}</span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-full">
                      {item.name.replace(".png", "")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HTML Meta Snippet Box */}
          <div className="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Code2 className="w-4 h-4 text-primary" />
                <span>HTML Code Snippet</span>
              </div>
              <button
                onClick={copyHtml}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted hover:bg-muted/80 text-xs font-medium text-foreground transition-colors"
              >
                {copiedHtml ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy HTML</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-muted/50 border border-border text-xs font-mono text-muted-foreground overflow-x-auto">
              <code>{htmlCodeSnippet}</code>
            </pre>
            <p className="text-[11px] text-muted-foreground">
              Paste these tags inside your site's <code>&lt;head&gt;</code> tag and drop the extracted files into your public root folder.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

