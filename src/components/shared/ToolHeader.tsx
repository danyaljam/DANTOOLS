"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, ShieldCheck, RotateCcw } from "lucide-react";

interface ToolHeaderProps {
  category: string;
  categoryHref?: string;
  title: string;
  description: string;
  badge?: string;
  onReset?: () => void;
  actions?: React.ReactNode;
}

export function ToolHeader({
  category,
  categoryHref = "/",
  title,
  description,
  badge,
  onReset,
  actions,
}: ToolHeaderProps) {
  return (
    <div className="border-b border-border bg-card/40 pb-6 mb-6">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground/80">{category}</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-primary font-medium">{title}</span>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {badge && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                {badge}
              </span>
            )}
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" /> Client-Side
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {actions}
          {onReset && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              title="Reset tool state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

