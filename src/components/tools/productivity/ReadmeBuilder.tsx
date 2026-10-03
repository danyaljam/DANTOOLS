"use client";

import * as React from "react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { toast } from "sonner";
import {
  FileCode,
  Copy,
  Check,
  Download,
  Eye,
  Plus,
  Trash2,
  Sparkles,
  LayoutTemplate,
} from "lucide-react";
import { downloadText } from "@/lib/utils";

interface ReadmeData {
  title: string;
  tagline: string;
  badges: { label: string; message: string; color: string }[];
  about: string;
  features: string[];
  techStack: string[];
  installCommand: string;
  runCommand: string;
  license: string;
  author: string;
}

const DEFAULT_README: ReadmeData = {
  title: "DAN Tools",
  tagline: "High-performance, 100% client-side web utility suite with zero backend dependencies.",
  badges: [
    { label: "License", message: "MIT", color: "blue" },
    { label: "Privacy", message: "100% Local", color: "success" },
    { label: "Built With", message: "Next.js 14", color: "black" },
    { label: "TypeScript", message: "Strict", color: "blue" },
  ],
  about:
    "DAN Tools is a collection of everyday utilities for developers and digital professionals. Every file manipulation, PDF merge, image resize, and data transformation happens directly inside your web browser.",
  features: [
    "PDF Merger, Page Resequencing, and Watermarker",
    "Local Image Compressor and Social Media Crop Presets",
    "EXIF Metadata Stripper with zero-leak rasterization",
    "Bidirectional JSON, CSV, and YAML Converter",
    "Regex Visualizer and Cron Schedule Explainer",
    "Zero cloud dependencies — costs $0 to host on Vercel or GitHub Pages",
  ],
  techStack: ["Next.js 14", "TypeScript", "Tailwind CSS", "PDF-Lib", "PDF.js", "JSZip"],
  installCommand: "npm install",
  runCommand: "npm run dev",
  license: "MIT",
  author: "Danyal Jamil",
};

export function ReadmeBuilder() {
  const [data, setData] = React.useState<ReadmeData>(DEFAULT_README);
  const [activeView, setActiveView] = React.useState<"preview" | "raw">("preview");
  const [copied, setCopied] = React.useState(false);

  // Feature item handlers
  const addFeature = () => {
    setData((prev) => ({ ...prev, features: [...prev.features, "New feature capability"] }));
  };

  const updateFeature = (index: number, val: string) => {
    setData((prev) => {
      const copy = [...prev.features];
      copy[index] = val;
      return { ...prev, features: copy };
    });
  };

  const removeFeature = (index: number) => {
    setData((prev) => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  };

  // Tech stack item handlers
  const addTech = (tech: string) => {
    if (!tech.trim() || data.techStack.includes(tech.trim())) return;
    setData((prev) => ({ ...prev, techStack: [...prev.techStack, tech.trim()] }));
  };

  const removeTech = (tech: string) => {
    setData((prev) => ({ ...prev, techStack: prev.techStack.filter((t) => t !== tech) }));
  };

  // Generate Markdown Text
  const generatedMarkdown = React.useMemo(() => {
    const badgeString = data.badges
      .map(
        (b) =>
          `![${b.label}](https://img.shields.io/badge/${encodeURIComponent(
            b.label
          )}-${encodeURIComponent(b.message)}-${b.color}?style=flat-square)`
      )
      .join(" ");

    return `# ${data.title}

${data.tagline}

${badgeString}

---

## 🚀 About

${data.about}

---

## ✨ Features

${data.features.map((f) => `- ${f}`).join("\n")}

---

## 🛠️ Tech Stack

${data.techStack.map((t) => `- **${t}**`).join("\n")}

---

## 📦 Getting Started

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/username/project.git

# Install dependencies
${data.installCommand}
\`\`\`

### Running Locally

\`\`\`bash
${data.runCommand}
\`\`\`

---

## 📄 License

Distributed under the **${data.license}** License. See \`LICENSE\` for more information.

---

Crafted with ❤️ by **${data.author}**.
`;
  }, [data]);

  const copyMarkdown = () => {
    navigator.clipboard.writeText(generatedMarkdown);
    setCopied(true);
    toast.success("README.md copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadReadme = () => {
    downloadText(generatedMarkdown, "README.md", "text/markdown");
    toast.success("Downloaded README.md!");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="Productivity & Text"
        title="Markdown & README Builder"
        description="Interactive form builder to generate production-ready GitHub README.md documents with badges, installation guides, and live preview."
        onReset={() => setData(DEFAULT_README)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Editor */}
        <div className="lg:col-span-6 space-y-6">
          {/* Project Details */}
          <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-foreground">Project Identity</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => setData({ ...data, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Tagline / Pitch
                </label>
                <input
                  type="text"
                  value={data.tagline}
                  onChange={(e) => setData({ ...data, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Author / Maintainer
                </label>
                <input
                  type="text"
                  value={data.author}
                  onChange={(e) => setData({ ...data, author: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  About Summary
                </label>
                <textarea
                  value={data.about}
                  onChange={(e) => setData({ ...data, about: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Key Features</h3>
              <button
                onClick={addFeature}
                className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Feature</span>
              </button>
            </div>

            <div className="space-y-2">
              {data.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => updateFeature(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={() => removeFeature(idx)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack Chips */}
          <div className="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-foreground">Tech Stack Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {data.techStack.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-xs font-medium text-foreground border border-border"
                >
                  <span>{tech}</span>
                  <button
                    onClick={() => removeTech(tech)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Type tech name (e.g. Docker, Rust, GraphQL) and hit Enter..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTech((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = "";
                }
              }}
              className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Quick CLI Commands */}
          <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-foreground">Getting Started Commands</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Install Command
                </label>
                <input
                  type="text"
                  value={data.installCommand}
                  onChange={(e) => setData({ ...data, installCommand: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background font-mono text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Dev Server Command
                </label>
                <input
                  type="text"
                  value={data.runCommand}
                  onChange={(e) => setData({ ...data, runCommand: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background font-mono text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Markdown & Code Preview */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex rounded-lg border border-border bg-muted p-0.5">
              <button
                onClick={() => setActiveView("preview")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeView === "preview"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Rendered Preview
              </button>
              <button
                onClick={() => setActiveView("raw")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeView === "raw"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Raw Markdown
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyMarkdown}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>

              <button
                onClick={downloadReadme}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download README.md</span>
              </button>
            </div>
          </div>

          {activeView === "preview" ? (
            <div className="rounded-2xl border border-border bg-card p-6 min-h-[580px] max-h-[720px] overflow-y-auto space-y-5 prose prose-slate dark:prose-invert max-w-none text-sm">
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                {data.title}
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">{data.tagline}</p>

              {/* Shields */}
              <div className="flex flex-wrap gap-1.5 not-prose">
                {data.badges.map((b) => (
                  <span
                    key={b.label}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted border border-border text-foreground"
                  >
                    <span className="font-bold mr-1">{b.label}:</span>
                    <span>{b.message}</span>
                  </span>
                ))}
              </div>

              <hr className="border-border my-4" />

              <h2 className="text-lg font-bold text-foreground">🚀 About</h2>
              <p className="text-muted-foreground leading-relaxed">{data.about}</p>

              <h2 className="text-lg font-bold text-foreground">✨ Features</h2>
              <ul className="space-y-1 list-disc pl-5 text-muted-foreground">
                {data.features.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>

              <h2 className="text-lg font-bold text-foreground">🛠️ Tech Stack</h2>
              <div className="flex flex-wrap gap-2 not-prose">
                {data.techStack.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <h2 className="text-lg font-bold text-foreground">📦 Getting Started</h2>
              <pre className="p-3.5 rounded-xl bg-muted/60 border border-border font-mono text-xs text-foreground not-prose">
                <code>
                  git clone https://github.com/username/project.git{"\n"}
                  {data.installCommand}{"\n"}
                  {data.runCommand}
                </code>
              </pre>

              <p className="text-xs text-muted-foreground">
                Distributed under the <strong>{data.license}</strong> License. Built by {data.author}.
              </p>
            </div>
          ) : (
            <textarea
              value={generatedMarkdown}
              readOnly
              rows={28}
              className="w-full p-4 rounded-2xl border border-border bg-card text-foreground font-mono text-xs leading-relaxed focus:outline-none shadow-xs resize-none select-all"
            />
          )}
        </div>
      </div>
    </div>
  );
}

