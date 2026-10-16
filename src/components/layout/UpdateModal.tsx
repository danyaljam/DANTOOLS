"use client";

import * as React from "react";
import { Copy, Check, Terminal, X, RefreshCw, Sparkles, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpdateModal({ isOpen, onClose }: UpdateModalProps) {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Command copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const updateCommands = [
    {
      key: "winget",
      platform: "Windows (WinGet Package Manager)",
      description: "Recommended if installed via Microsoft WinGet package repository.",
      command: "winget upgrade --id DanyalJam.DTools --exact",
    },
    {
      key: "powershell",
      platform: "Windows (PowerShell Direct Updater)",
      description: "One-liner to auto-detect and update your local repository or download the latest EXE.",
      command: "irm https://raw.githubusercontent.com/danyaljam/DANTOOLS/main/scripts/update-windows.ps1 | iex",
    },
    {
      key: "brew",
      platform: "macOS / Linux (Homebrew)",
      description: "If installed through the official Homebrew tap.",
      command: "brew upgrade dtools",
    },
    {
      key: "source",
      platform: "Source / Git Installation (All Platforms)",
      description: "Run in the application folder to pull the latest source and rebuild.",
      command: "npm run update",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-6 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Update Installed DAN Tools</h2>
              <p className="text-xs text-muted-foreground">
                Current Version: <span className="font-mono font-semibold text-primary">v1.0.6</span> • 100% Offline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Updates preserve all your local settings. No document or data ever leaves your device.</span>
        </div>

        <div className="space-y-3.5 max-h-[55vh] overflow-y-auto pr-1">
          {updateCommands.map((item) => (
            <div key={item.key} className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{item.platform}</span>
                <button
                  onClick={() => copyToClipboard(item.key, item.command)}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
                >
                  {copiedKey === item.key ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === item.key ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">{item.description}</p>
              <div className="p-2 rounded-lg bg-background border border-border/60 font-mono text-[11px] text-foreground flex items-center gap-2 overflow-x-auto">
                <Terminal className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="select-all">{item.command}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
          <a
            href="https://github.com/danyaljam/DANTOOLS/releases/latest"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            Standalone GitHub Releases <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
