"use client";

import * as React from "react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { toast } from "sonner";
import { Check, Copy, KeyRound, RefreshCw } from "lucide-react";

function randomIndex(max: number) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % max;
}

export function PasswordGenerator() {
  const [length, setLength] = React.useState(20);
  const [options, setOptions] = React.useState({ upper: true, lower: true, numbers: true, symbols: true });
  const [password, setPassword] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const generate = React.useCallback(() => {
    const groups = [
      options.upper ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "",
      options.lower ? "abcdefghijkmnopqrstuvwxyz" : "",
      options.numbers ? "23456789" : "",
      options.symbols ? "!@#$%^&*()-_=+[]{}" : "",
    ].filter(Boolean);
    if (!groups.length) { setPassword(""); return; }
    const pool = groups.join("");
    const required = groups.map((group) => group[randomIndex(group.length)]);
    const result = [...required];
    while (result.length < length) result.push(pool[randomIndex(pool.length)]);
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = randomIndex(index + 1);
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    setPassword(result.join(""));
  }, [length, options]);

  React.useEffect(() => { generate(); }, [generate]);

  const copy = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success("Password copied to clipboard.");
    window.setTimeout(() => setCopied(false), 1600);
  };

  const toggle = (key: keyof typeof options) => setOptions((previous) => ({ ...previous, [key]: !previous[key] }));
  const strength = length >= 24 && options.symbols ? "Excellent" : length >= 16 ? "Strong" : length >= 12 ? "Good" : "Short";

  return <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full">
    <ToolHeader category="Developer & Data" title="Secure Password Generator" description="Generate strong passwords locally with the Web Crypto API. Nothing is stored or sent anywhere." onReset={() => { setLength(20); setOptions({ upper: true, lower: true, numbers: true, symbols: true }); }} />
    <div className="space-y-5">
      <div className="p-6 rounded-2xl border border-border bg-card space-y-5">
        <div className="flex items-center gap-3"><KeyRound className="w-5 h-5 text-primary" /><span className="text-sm font-bold">Generated password</span><span className="ml-auto text-xs font-semibold text-emerald-600">{strength}</span></div>
        <div className="flex gap-2"><input readOnly value={password} className="min-w-0 flex-1 px-4 py-3 rounded-xl border border-border bg-background font-mono text-sm" /><button onClick={copy} className="inline-flex items-center gap-2 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? "Copied" : "Copy"}</button><button onClick={generate} className="p-3 rounded-xl border border-border hover:bg-muted" title="Generate another password"><RefreshCw className="w-4 h-4" /></button></div>
        <div><div className="flex justify-between text-xs font-semibold mb-2"><span>Password length</span><span className="text-primary">{length}</span></div><input type="range" min="8" max="64" value={length} onChange={(event) => setLength(Number(event.target.value))} className="w-full accent-primary" /></div>
        <div className="grid grid-cols-2 gap-3">{([['upper', 'Uppercase letters'], ['lower', 'Lowercase letters'], ['numbers', 'Numbers'], ['symbols', 'Symbols']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" checked={options[key]} onChange={() => toggle(key)} className="accent-primary" />{label}</label>)}</div>
      </div>
      <p className="text-xs text-muted-foreground">Ambiguous characters such as 0, O, 1, l, and I are excluded for easier manual reading.</p>
    </div>
  </div>;
}
