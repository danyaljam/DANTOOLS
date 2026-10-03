"use client";

import * as React from "react";
import { ShieldCheck, Lock, Cpu, DatabaseZap, X, Info } from "lucide-react";

export function PrivacyBadge() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        title="Click to view Local Privacy Guarantee"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <ShieldCheck className="w-3.5 h-3.5" />
        <span className="hidden sm:inline font-semibold">100% Private & Local</span>
        <span className="hidden md:inline text-muted-foreground">— Files never leave your device</span>
        <Info className="w-3 h-3 opacity-60 group-hover:opacity-100" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Local & Client-Side Guarantee</h3>
                  <p className="text-xs text-muted-foreground">Zero servers. Zero tracking. 100% private.</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-sm text-muted-foreground">
              <div className="flex gap-3 items-start p-3 rounded-xl bg-muted/40 border border-border/50">
                <Cpu className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Processed In Your Browser</h4>
                  <p className="text-xs mt-0.5 leading-relaxed">
                    All PDF rendering, image conversions, compression, data transformations, and text processing run strictly inside your browser's JavaScript runtime and HTML5 Canvas.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 rounded-xl bg-muted/40 border border-border/50">
                <DatabaseZap className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">No Backend Servers or Databases</h4>
                  <p className="text-xs mt-0.5 leading-relaxed">
                    DAN Tools contains no API routes, server-side storage, analytics, or external upload endpoints. Tool inputs are processed in your browser and are not sent to a network service.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 rounded-xl bg-muted/40 border border-border/50">
                <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Confidential & Safe</h4>
                  <p className="text-xs mt-0.5 leading-relaxed">
                    Perfect for sensitive personal documents, legal contracts, passports, financial spreadsheets, and proprietary source code.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-colors"
              >
                Understood, Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function PrivacyNoticeBanner() {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 text-xs text-emerald-800 dark:text-emerald-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong className="font-semibold">Privacy First:</strong> Files and tool inputs stay on this device. No analytics or external processing services are used.
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-emerald-500/20 rounded text-emerald-700 dark:text-emerald-300"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

