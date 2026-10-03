"use client";

import * as React from "react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import cronstrue from "cronstrue";
import { toast } from "sonner";
import {
  Clock,
  Calendar,
  Sparkles,
  Copy,
  Check,
  CalendarDays,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface Preset {
  name: string;
  expression: string;
  description: string;
}

const PRESETS: Preset[] = [
  { name: "Every 5 Minutes", expression: "*/5 * * * *", description: "Frequently recurring task" },
  { name: "Every Hour", expression: "0 * * * *", description: "At minute 0 of every hour" },
  { name: "Every Midnight", expression: "0 0 * * *", description: "Daily cleanup / backup" },
  { name: "Mon-Fri at 9 AM", expression: "0 9 * * 1-5", description: "Business days morning" },
  { name: "Every Sunday Midnight", expression: "0 0 * * 0", description: "Weekly batch processing" },
  { name: "1st of Month at Midnight", expression: "0 0 1 * *", description: "Monthly invoicing / billing" },
];

export function CronExplainer() {
  const [expression, setExpression] = React.useState<string>("*/15 9-17 * * 1-5");
  const [humanReadable, setHumanReadable] = React.useState<string>("");
  const [cronError, setCronError] = React.useState<string | null>(null);
  const [nextRuns, setNextRuns] = React.useState<Date[]>([]);
  const [copied, setCopied] = React.useState(false);

  // Parse expression & calculate upcoming dates
  React.useEffect(() => {
    const trimmed = expression.trim();
    if (!trimmed) {
      setHumanReadable("");
      setCronError(null);
      setNextRuns([]);
      return;
    }

    try {
      const explanation = cronstrue.toString(trimmed, { use24HourTimeFormat: false });
      setHumanReadable(explanation);
      setCronError(null);

      // Compute next 5 occurrences
      const simulated = computeNextRuns(trimmed, 5);
      setNextRuns(simulated);
    } catch (err: any) {
      setCronError(err.message || "Invalid cron expression");
      setHumanReadable("");
      setNextRuns([]);
    }
  }, [expression]);

  /**
   * Safe browser-side next run calculator for standard 5-part cron
   */
  const computeNextRuns = (cronStr: string, count: number): Date[] => {
    const parts = cronStr.trim().split(/\s+/);
    if (parts.length !== 5) return [];

    const [minPart, hourPart, domPart, monthPart, dowPart] = parts;
    const runs: Date[] = [];
    const now = new Date();
    const candidate = new Date(now.getTime());
    candidate.setSeconds(0, 0);
    candidate.setMinutes(candidate.getMinutes() + 1); // Start from next minute

    // Check matches
    const matchField = (val: number, part: string, offset = 0): boolean => {
      if (part === "*") return true;
      if (part.startsWith("*/")) {
        const step = parseInt(part.replace("*/", ""), 10);
        return !isNaN(step) && val % step === 0;
      }
      if (part.includes(",")) {
        return part.split(",").some((p) => matchField(val, p, offset));
      }
      if (part.includes("-")) {
        const [s, e] = part.split("-").map((n) => parseInt(n, 10));
        return val >= s && val <= e;
      }
      return parseInt(part, 10) === val;
    };

    let iterations = 0;
    while (runs.length < count && iterations < 100000) {
      iterations++;
      const min = candidate.getMinutes();
      const hour = candidate.getHours();
      const dom = candidate.getDate();
      const month = candidate.getMonth() + 1;
      const dow = candidate.getDay(); // 0-6

      const matchMin = matchField(min, minPart);
      const matchHour = matchField(hour, hourPart);
      const matchDom = matchField(dom, domPart);
      const matchMonth = matchField(month, monthPart);
      const matchDow = matchField(dow, dowPart);

      if (matchMin && matchHour && matchDom && matchMonth && matchDow) {
        runs.push(new Date(candidate.getTime()));
      }

      candidate.setMinutes(candidate.getMinutes() + 1);
    }

    return runs;
  };

  const copyExpression = () => {
    navigator.clipboard.writeText(expression);
    setCopied(true);
    toast.success("Cron expression copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const parts = expression.trim().split(/\s+/);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="Developer & Data"
        title="Cron Schedule Explainer"
        description="Translate 5-part cron expressions into plain English with a schedule of upcoming run dates."
        onReset={() => setExpression("0 9 * * 1-5")}
      />

      {/* Preset Pills */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Common Schedules</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => setExpression(p.expression)}
              className="px-3 py-1.5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted text-xs font-medium text-foreground transition-all shadow-xs"
            >
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Expression Input Card */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-5 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">
            Cron Expression (5 Fields)
          </label>

          <button
            onClick={copyExpression}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted hover:bg-muted/80 text-xs font-medium text-foreground transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Cron</span>
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="* * * * *"
            className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-lg sm:text-xl font-mono text-primary font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
          />
        </div>

        {/* 5 Fields Guide */}
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {[
            { name: "Minute", val: parts[0] || "*", range: "0-59" },
            { name: "Hour", val: parts[1] || "*", range: "0-23" },
            { name: "Day (Month)", val: parts[2] || "*", range: "1-31" },
            { name: "Month", val: parts[3] || "*", range: "1-12" },
            { name: "Day (Week)", val: parts[4] || "*", range: "0-6 (Sun-Sat)" },
          ].map((field) => (
            <div key={field.name} className="p-2.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <span className="font-bold text-foreground block">{field.name}</span>
              <span className="font-mono text-primary font-semibold text-sm block">{field.val}</span>
              <span className="text-[10px] text-muted-foreground block">{field.range}</span>
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {cronError && (
          <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-mono">{cronError}</span>
          </div>
        )}
      </div>

      {/* Human Readable Interpretation & Upcoming Occurrences */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Natural Language Explanation */}
        <div className="lg:col-span-6 space-y-3">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Plain English Translation
          </span>

          <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 min-h-[160px] flex flex-col justify-center space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <Clock className="w-4 h-4" />
              <span>Schedule Summary</span>
            </div>
            <p className="text-xl font-bold text-foreground leading-relaxed">
              {humanReadable || "Enter a valid cron expression..."}
            </p>
            <p className="text-xs text-muted-foreground">
              Evaluated in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
            </p>
          </div>
        </div>

        {/* Next 5 Execution Times */}
        <div className="lg:col-span-6 space-y-3">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Upcoming Run Times (Next 5)
          </span>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-2 shadow-xs">
            {nextRuns.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No upcoming execution times computed.
              </div>
            ) : (
              <div className="divide-y divide-border/40 text-xs">
                {nextRuns.map((date, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <span className="font-mono text-muted-foreground">#{idx + 1}</span>
                    <span className="font-semibold text-foreground">
                      {date.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="font-mono text-primary font-bold">
                      {date.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
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

