"use client";

import * as React from "react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { GitCompareArrows, Copy } from "lucide-react";
import { toast } from "sonner";

type DiffRow = { type: 'same' | 'added' | 'removed'; text: string };
function diffLines(left: string, right: string): DiffRow[] { const a = left.split('\n'), b = right.split('\n'); const table = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0)); for (let i = a.length - 1; i >= 0; i -= 1) for (let j = b.length - 1; j >= 0; j -= 1) table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]); const rows: DiffRow[] = []; let i = 0, j = 0; while (i < a.length || j < b.length) { if (i < a.length && j < b.length && a[i] === b[j]) { rows.push({ type: 'same', text: a[i] }); i += 1; j += 1; } else if (j < b.length && (i === a.length || table[i][j + 1] >= table[i + 1][j])) { rows.push({ type: 'added', text: b[j] }); j += 1; } else { rows.push({ type: 'removed', text: a[i] }); i += 1; } } return rows; }

export function TextDiff() {
  const [left, setLeft] = React.useState('const status = "draft";\nreturn status;');
  const [right, setRight] = React.useState('const status = "published";\nreturn status;');
  const rows = React.useMemo(() => diffLines(left, right), [left, right]);
  const changed = rows.filter((row) => row.type !== 'same').length;
  const copy = async () => { await navigator.clipboard.writeText(rows.map((row) => `${row.type === 'added' ? '+' : row.type === 'removed' ? '-' : ' '} ${row.text}`).join('\n')); toast.success('Diff copied.'); };
  return <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full"><ToolHeader category="Developer & Data" title="Text Diff Checker" description="Compare two text or code blocks locally and inspect added, removed, and unchanged lines." onReset={() => { setLeft(''); setRight(''); }} actions={<button onClick={copy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium"><Copy className="w-3.5 h-3.5" />Copy diff</button>} /><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><TextArea label="Original" value={left} onChange={setLeft} /><TextArea label="Updated" value={right} onChange={setRight} /></div><div className="mt-5 rounded-2xl border border-border bg-card overflow-hidden"><div className="flex items-center gap-2 px-4 py-3 border-b border-border text-xs font-semibold"><GitCompareArrows className="w-4 h-4 text-primary" />{changed} changed line(s)</div><pre className="p-4 overflow-x-auto text-xs leading-6 font-mono">{rows.map((row, index) => <div key={`${index}-${row.type}`} className={row.type === 'added' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : row.type === 'removed' ? 'bg-red-500/15 text-red-700 dark:text-red-300' : 'text-muted-foreground'}><span className="inline-block w-5 select-none">{row.type === 'added' ? '+' : row.type === 'removed' ? '-' : ' '}</span>{row.text || ' '}</div>)}</pre></div></div>;
}
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-xs font-bold text-foreground">{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} rows={10} className="mt-2 w-full p-3 rounded-xl border border-border bg-card font-mono text-xs leading-5 resize-y" placeholder={`Paste ${label.toLowerCase()} text...`} /></label>; }
