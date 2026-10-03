"use client";

import * as React from "react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { toast } from "sonner";
import {
  Regex,
  CheckCircle2,
  AlertCircle,
  Copy,
  BookOpen,
  Sparkles,
  Info,
} from "lucide-react";

interface MatchResult {
  index: number;
  match: string;
  groups: string[];
}

interface Snippet {
  name: string;
  pattern: string;
  flags: string;
  description: string;
  sample: string;
}

const SNIPPETS: Snippet[] = [
  {
    name: "Email Address",
    pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    flags: "g",
    description: "Matches standard RFC-compliant email addresses",
    sample: "Contact us at support@example.com or sales.team@sub.domain.org for inquiries.",
  },
  {
    name: "URL / HTTP(S)",
    pattern: "https?:\\/\\/[\\w.-]+(?:\\.[a-zA-Z]{2,})+(?:\\/[\\w._~:/?#\\[\\]@!$&'()*+,;=-]*)?",
    flags: "g",
    description: "Matches full web URLs with optional path, query, and protocol",
    sample: "Check our site at https://example.com/docs?query=test#section or http://localhost:3000",
  },
  {
    name: "IPv4 Address",
    pattern: "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b",
    flags: "g",
    description: "Matches valid IP addresses between 0.0.0.0 and 255.255.255.255",
    sample: "Primary DNS: 192.168.1.1, Google DNS: 8.8.8.8, Invalid: 999.1.1.1",
  },
  {
    name: "UUID (v4)",
    pattern: "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}",
    flags: "g",
    description: "Matches 36-character UUID identifiers",
    sample: "User record ID: 123e4567-e89b-12d3-a456-426614174000 created successfully.",
  },
  {
    name: "Hex Color",
    pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b",
    flags: "g",
    description: "Matches 3 or 6 digit hex color codes",
    sample: "Themes: #fff, #1e293b, #ef4444, and invalid #zzzzzz",
  },
  {
    name: "Date (YYYY-MM-DD)",
    pattern: "\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])\\b",
    flags: "g",
    description: "Matches ISO 8601 calendar date formats",
    sample: "Events scheduled for 2026-09-15 and 2027-01-01.",
  },
];

export function RegexTester() {
  const [pattern, setPattern] = React.useState<string>("(\\w+)@([\\w.-]+)");
  const [flags, setFlags] = React.useState<Record<string, boolean>>({
    g: true,
    i: true,
    m: false,
    s: false,
    u: false,
  });

  const [testText, setTestText] = React.useState<string>(
    "Send queries to support@localtools.dev or contact admin@company.org."
  );

  const [matches, setMatches] = React.useState<MatchResult[]>([]);
  const [regexError, setRegexError] = React.useState<string | null>(null);

  // Active flags string
  const activeFlagsString = React.useMemo(() => {
    return Object.entries(flags)
      .filter(([_, active]) => active)
      .map(([f]) => f)
      .join("");
  }, [flags]);

  // Execute regex
  React.useEffect(() => {
    if (!pattern) {
      setMatches([]);
      setRegexError(null);
      return;
    }

    try {
      setRegexError(null);
      const re = new RegExp(pattern, activeFlagsString);
      const results: MatchResult[] = [];

      if (flags.g) {
        let m: RegExpExecArray | null;
        let lastIndex = -1;
        while ((m = re.exec(testText)) !== null) {
          if (m.index === lastIndex) {
            re.lastIndex++;
          }
          lastIndex = m.index;
          results.push({
            index: m.index,
            match: m[0],
            groups: m.slice(1),
          });
          if (results.length > 500) break; // safety guard
        }
      } else {
        const m = re.exec(testText);
        if (m) {
          results.push({
            index: m.index,
            match: m[0],
            groups: m.slice(1),
          });
        }
      }

      setMatches(results);
    } catch (err: any) {
      setRegexError(err.message || "Invalid regular expression");
      setMatches([]);
    }
  }, [pattern, activeFlagsString, testText, flags.g]);

  const toggleFlag = (flag: string) => {
    setFlags((prev) => ({ ...prev, [flag]: !prev[flag] }));
  };

  const applySnippet = (snippet: Snippet) => {
    setPattern(snippet.pattern);
    setTestText(snippet.sample);
    const newFlags: Record<string, boolean> = { g: false, i: false, m: false, s: false, u: false };
    for (const char of snippet.flags) {
      newFlags[char] = true;
    }
    setFlags(newFlags);
    toast.success(`Loaded "${snippet.name}" template`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="Developer & Data"
        title="Regex Visualizer & Tester"
        description="Interactive regular expression evaluator with live highlighting, capture groups breakdown, and snippet cheat-sheet."
        onReset={() => {
          setPattern("(\\w+)@([\\w.-]+)");
          setTestText("Send queries to support@localtools.dev or contact admin@company.org.");
        }}
      />

      {/* Snippet Cheat-Sheet Bar */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Quick Cheat-Sheet Snippets</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SNIPPETS.map((snip) => (
            <button
              key={snip.name}
              onClick={() => applySnippet(snip)}
              className="px-3 py-1.5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted text-xs font-medium text-foreground transition-all flex items-center gap-1.5 shadow-xs"
            >
              <span>{snip.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pattern Input and Flags */}
      <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">
            Regular Expression Pattern
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">Flags:</span>
            {[
              { id: "g", label: "global (g)" },
              { id: "i", label: "case-insensitive (i)" },
              { id: "m", label: "multiline (m)" },
              { id: "s", label: "dotAll (s)" },
            ].map((f) => {
              const active = flags[f.id];
              return (
                <button
                  key={f.id}
                  onClick={() => toggleFlag(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  title={f.label}
                >
                  {f.id}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-sm bg-background border border-border rounded-xl px-3 py-2.5 shadow-inner">
          <span className="text-primary font-bold">/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Enter regex pattern..."
            className="flex-1 bg-transparent text-foreground focus:outline-none"
          />
          <span className="text-primary font-bold">/{activeFlagsString}</span>
        </div>

        {regexError && (
          <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-mono">{regexError}</span>
          </div>
        )}
      </div>

      {/* Test Area and Live Match Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Test String Input */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold uppercase tracking-wider text-foreground">
              Test String
            </span>
            <span className="font-mono">{testText.length} chars</span>
          </div>

          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Type or paste sample text to test against..."
            rows={12}
            className="w-full p-4 rounded-2xl border border-border bg-card text-foreground font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary shadow-xs resize-none"
          />
        </div>

        {/* Right: Matches Inspector */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <span>Matches Found</span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-bold">
                {matches.length}
              </span>
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-3 max-h-[360px] overflow-y-auto shadow-xs">
            {matches.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                No matches found with current pattern and flags.
              </div>
            ) : (
              <div className="space-y-2.5 divide-y divide-border/40">
                {matches.map((m, idx) => (
                  <div key={idx} className="pt-2 first:pt-0 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        Match #{idx + 1}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        Index: {m.index}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/40 font-mono text-xs text-foreground break-all border border-border/50">
                      {m.match}
                    </div>

                    {m.groups.length > 0 && (
                      <div className="pl-3 border-l-2 border-primary/30 space-y-1 text-[11px] font-mono">
                        {m.groups.map((grp, gIdx) => (
                          <div key={gIdx} className="text-muted-foreground">
                            Group {gIdx + 1}:{" "}
                            <span className="text-foreground font-semibold">
                              {grp !== undefined ? grp : "undefined"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

