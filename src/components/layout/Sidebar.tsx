"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Image as ImageIcon,
  Code2,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Zap,
  HardDriveDownload,
  FileSpreadsheet,
  PenLine,
  Globe,
} from "lucide-react";
import { CATEGORIES, TOOLS, ToolCategory } from "@/lib/tools-registry";

const categoryIconMap: Record<ToolCategory, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  image: ImageIcon,
  developer: Code2,
  productivity: Sparkles,
  office: FileSpreadsheet,
  writing: PenLine,
  web: Globe,
};

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="w-72 border-r border-border bg-card/50 flex flex-col h-[calc(100vh-4rem)] sticky top-16 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {CATEGORIES.map((cat) => {
          const CatIcon = categoryIconMap[cat.id];
          const catTools = TOOLS.filter((t) => t.category === cat.id);

          return (
            <div key={cat.id} className="space-y-1.5">
              <div className="flex items-center justify-between px-2.5 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center gap-2">
                  <CatIcon className="w-3.5 h-3.5 text-primary" />
                  {cat.name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-muted border border-border">
                  {catTools.length}
                </span>
              </div>

              <div className="space-y-0.5">
                {catTools.map((tool) => {
                  const isActive = pathname === tool.href;
                  return (
                    <Link
                      key={tool.id}
                      href={tool.href}
                      onClick={onClose}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                            isActive ? "bg-primary-foreground scale-125" : "bg-border group-hover:bg-primary"
                          }`}
                        />
                        <span className="truncate">{tool.title}</span>
                      </div>

                      {tool.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-primary/10 text-primary border border-primary/20"
                          }`}
                        >
                          {tool.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-border bg-muted/20">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Zero-Cloud Processing</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            All {TOOLS.length} tools run 100% in your browser. No files or inputs leave your RAM.
          </p>
        </div>
      </div>
    </aside>
  );
}

