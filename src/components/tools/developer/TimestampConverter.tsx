"use client";

import * as React from "react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { Clock, Copy } from "lucide-react";
import { toast } from "sonner";

export function TimestampConverter() {
  const [dateValue, setDateValue] = React.useState(() => new Date().toISOString().slice(0, 16));
  const [timestamp, setTimestamp] = React.useState(() => String(Math.floor(Date.now() / 1000)));
  const date = new Date(dateValue);
  const timestampDate = new Date(Number(timestamp) * (timestamp.length > 11 ? 1 : 1000));
  const validDate = !Number.isNaN(date.getTime());
  const validTimestamp = !Number.isNaN(timestampDate.getTime());

  const copy = async (value: string) => { await navigator.clipboard.writeText(value); toast.success("Copied to clipboard."); };
  const updateDate = (value: string) => { setDateValue(value); const next = new Date(value); if (!Number.isNaN(next.getTime())) setTimestamp(String(Math.floor(next.getTime() / 1000))); };
  const updateTimestamp = (value: string) => { setTimestamp(value); const next = new Date(Number(value) * (value.length > 11 ? 1 : 1000)); if (!Number.isNaN(next.getTime())) setDateValue(new Date(next.getTime() - next.getTimezoneOffset() * 60000).toISOString().slice(0, 16)); };

  return <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
    <ToolHeader category="Developer & Data" title="Unix Timestamp Converter" description="Convert Unix seconds or milliseconds to local dates and ISO 8601 without leaving your browser." onReset={() => { const now = new Date(); setDateValue(now.toISOString().slice(0, 16)); setTimestamp(String(Math.floor(now.getTime() / 1000))); }} />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="p-5 rounded-2xl border border-border bg-card space-y-4"><div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /><h2 className="text-sm font-bold">Date to timestamp</h2></div><input type="datetime-local" value={dateValue} onChange={(event) => updateDate(event.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />{validDate && <div className="space-y-2 text-xs"><Row label="Unix seconds" value={String(Math.floor(date.getTime() / 1000))} onCopy={copy} /><Row label="Unix milliseconds" value={String(date.getTime())} onCopy={copy} /><Row label="ISO 8601" value={date.toISOString()} onCopy={copy} /></div>}</div>
      <div className="p-5 rounded-2xl border border-border bg-card space-y-4"><h2 className="text-sm font-bold">Timestamp to date</h2><input inputMode="numeric" value={timestamp} onChange={(event) => updateTimestamp(event.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono text-sm" placeholder="1710000000" />{validTimestamp && <div className="space-y-2 text-xs"><Row label="Local time" value={timestampDate.toLocaleString()} onCopy={copy} /><Row label="ISO 8601" value={timestampDate.toISOString()} onCopy={copy} /><Row label="UTC" value={timestampDate.toUTCString()} onCopy={copy} /></div>}</div>
    </div>
    <p className="mt-4 text-xs text-muted-foreground">Values with more than 11 digits are treated as milliseconds. All conversions happen locally.</p>
  </div>;
}

function Row({ label, value, onCopy }: { label: string; value: string; onCopy: (value: string) => void }) { return <div className="flex items-center gap-2"><span className="w-28 text-muted-foreground">{label}</span><code className="min-w-0 flex-1 truncate text-foreground">{value}</code><button onClick={() => onCopy(value)} className="p-1.5 rounded-md hover:bg-muted" title={`Copy ${label}`}><Copy className="w-3.5 h-3.5" /></button></div>; }
