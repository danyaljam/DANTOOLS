"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Code2,
  Sparkles,
  Files,
  RotateCw,
  Stamp,
  FileImage,
  Minimize2,
  Crop,
  ShieldAlert,
  Layers,
  EyeOff,
  ArrowLeftRight,
  Regex,
  Clock,
  KeyRound,
  FileCode,
  Sparkle,
  Receipt,
  Share2,
  Edit3,
  FileDown,
  Palette,
  GitCompareArrows,
  FileSpreadsheet,
  PenLine,
  Globe,
  FunctionSquare,
  Hash,
  Table2,
  Percent,
  Calculator,
  AlignLeft,
  CaseSensitive,
  Link2,
  CalendarDays,
  Globe2,
  Trash2,
  ScanLine,
  Wrench,
  ScanText,
  Presentation,
  Archive,
  Unlock,
  PenTool,
  Languages,
} from "lucide-react";
import { CATEGORIES, TOOLS, ToolCategory, ToolDefinition } from "@/lib/tools-registry";

const iconComponentMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Files,
  RotateCw,
  Stamp,
  FileImage,
  Minimize2,
  Crop,
  ShieldAlert,
  Layers,
  EyeOff,
  ArrowLeftRight,
  Regex,
  Clock,
  KeyRound,
  FileCode,
  Sparkle,
  Receipt,
  Share2,
  Edit3,
  FileDown,
  Palette,
  GitCompareArrows,
  FileSpreadsheet,
  PenLine,
  Globe,
  FunctionSquare,
  Hash,
  Table2,
  Percent,
  Calculator,
  AlignLeft,
  CaseSensitive,
  Link2,
  CalendarDays,
  Globe2,
  Trash2,
  ScanLine,
  Wrench,
  ScanText,
  Presentation,
  Archive,
  Unlock,
  Lock,
  PenTool,
  Languages,
  Sparkles,
  FileText,
};

const categoryColorMap: Record<ToolCategory, { bg: string; text: string; border: string }> = {
  pdf: {
    bg: "bg-rose-500/10 dark:bg-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/20",
  },
  image: {
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
  },
  developer: {
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
  },
  productivity: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
  office: {
    bg: "bg-cyan-500/10 dark:bg-cyan-500/20",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-500/20",
  },
  writing: {
    bg: "bg-violet-500/10 dark:bg-violet-500/20",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500/20",
  },
  web: {
    bg: "bg-orange-500/10 dark:bg-orange-500/20",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-500/20",
  },
};

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const filteredTools = React.useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesCategory =
        selectedCategory === "all" || tool.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        tool.title.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.keywords.some((k) => k.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-10 max-w-7xl mx-auto w-full">
      {/* Hero Section */}
      <div className="relative rounded-3xl border border-border bg-gradient-to-b from-card to-card/60 p-8 sm:p-12 overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Zero-Cloud Privacy Standard • Works Offline</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Everyday web utilities,{" "}
            <span className="bg-gradient-to-r from-primary via-blue-500 to-emerald-500 bg-clip-text text-transparent">
              100% processed on your machine.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Convert, compress, merge, decode, and optimize without ever uploading sensitive
            documents or confidential data to third-party cloud servers.
          </p>

          {/* Search bar inside Hero */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-xl">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search utilities (e.g. merge pdf, compress image, cron, jwt, csv to json)..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded bg-muted"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="https://github.com/danyaljam/DANTOOLS/releases/latest"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-opacity"
            >
              Download for Windows (.exe)
            </a>
          </div>
        </div>

        {/* Feature stats counter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-border/60">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">{TOOLS.length} Tools</div>
            <div className="text-xs text-muted-foreground">Production-Ready</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">0 KB</div>
            <div className="text-xs text-muted-foreground">Data Uploaded</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">100%</div>
            <div className="text-xs text-muted-foreground">Client-Side WASM & Canvas</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">$0 / mo</div>
            <div className="text-xs text-muted-foreground">Free Forever</div>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          All Tools ({TOOLS.length})
        </button>

        {CATEGORIES.map((cat) => {
          const count = TOOLS.filter((t) => t.category === cat.id).length;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Categorized Tool Cards */}
      <div>
        {filteredTools.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card">
            <p className="text-muted-foreground text-sm">
              No tools match your query "{searchQuery}".
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-3 text-xs text-primary font-semibold hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {CATEGORIES.map((category) => {
              const categoryTools = filteredTools.filter((tool) => tool.category === category.id);
              if (!categoryTools.length) return null;
              const color = categoryColorMap[category.id];

              return (
                <section key={category.id} className="space-y-4" aria-labelledby={`${category.id}-heading`}>
                  <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
                    <div>
                      <h2 id={`${category.id}-heading`} className="text-xl font-bold text-foreground">{category.name}</h2>
                      <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${color.bg} ${color.text} border ${color.border}`}>
                      {categoryTools.length} tools
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {categoryTools.map((tool) => {
                      const IconComp = iconComponentMap[tool.icon] || WrenchIconFallback;
                      return (
                        <Link key={tool.id} href={tool.href} className="group relative flex flex-col justify-between p-6 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.bg} ${color.text} border ${color.border} group-hover:scale-110 transition-transform`}><IconComp className="w-6 h-6" /></div>
                              {tool.badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">{tool.badge}</span>}
                            </div>
                            <div className="space-y-1.5">
                              <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">{tool.title}<ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" /></h3>
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{tool.description}</p>
                            </div>
                          </div>
                          <div className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground"><span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium"><ShieldCheck className="w-3.5 h-3.5" /> 100% In-Browser</span><span className="group-hover:text-foreground transition-colors font-medium">Launch Tool &rarr;</span></div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Privacy Architecture Banner */}
      <div className="p-6 sm:p-8 rounded-2xl border border-border bg-muted/30 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <Zap className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">Instant Processing</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No slow network upload times. Massive PDFs and high-res images process at raw CPU speed directly in your browser.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">Zero Server Retention</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We never store, log, or transmit your files. Even if an attacker compromised our host, your files never exist on our machines.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">Confidential Document Safe</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Designed for contracts, passports, tax forms, confidential keys, and internal documentation where cloud upload is prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WrenchIconFallback({ className }: { className?: string }) {
  return <FileText className={className} />;
}

