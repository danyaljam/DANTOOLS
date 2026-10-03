"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Files, FileDown, ChevronRight, FilePlus2, Download } from "lucide-react";
import { PrivacyBadge } from "./PrivacyNotice";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchModal } from "./SearchModal";

const PDF_QUICK_LINKS = [
  { label: "Merge PDF", href: "/tools/pdf-merge-split", icon: Files },
  { label: "Split PDF", href: "/tools/pdf-merge-split", icon: FilePlus2 },
  { label: "Compress PDF", href: "/tools/pdf-compressor", icon: FileDown },
];

export function Navbar() {
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur-md">
        {/* PDF Quick-access strip */}
        <div className="hidden md:flex items-center gap-0.5 px-6 border-b border-border/60 bg-muted/30 overflow-x-auto">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mr-3 shrink-0">
            PDF Quick Tools:
          </span>
          {PDF_QUICK_LINKS.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all group whitespace-nowrap"
            >
              <Icon className="w-3 h-3 shrink-0 group-hover:scale-110 transition-transform" />
              {label}
            </Link>
          ))}
          <div className="ml-auto flex items-center">
            <Link
              href="/"
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition px-2 py-1.5 whitespace-nowrap"
            >
              All Tools <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Main nav row */}
        <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <img
                src="/brand-logo.png"
                alt="dantools — PDF, HTML, Finance, Docs"
                width={860}
                height={180}
                className="h-9 sm:h-10 w-auto group-hover:scale-[1.02] transition-transform"
              />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/danyaljam/DANTOOLS/releases/latest"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Windows EXE
            </a>

            {/* Prominent Privacy Badge */}
            <PrivacyBadge />

            {/* Quick Search Bar */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/60 hover:bg-muted border border-border rounded-lg transition-colors w-52 justify-between"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5" />
                <span>Search tools...</span>
              </div>
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-card border border-border rounded shadow-xs">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
