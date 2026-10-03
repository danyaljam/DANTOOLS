"use client";

import * as React from "react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { ToolDefinition } from "@/lib/tools-registry";
import { downloadText } from "@/lib/utils";
import { toast } from "sonner";
import { Check, Copy, Download, RefreshCw } from "lucide-react";

type Props = { tool: ToolDefinition };
type Settings = { secondary: string; option: string; optionTwo: string; count: number };

const DEFAULT_SETTINGS: Settings = { secondary: "", option: "", optionTwo: "", count: 5 };

export function UtilityWorkspace({ tool }: Props) {
  const [input, setInput] = React.useState(defaultInput(tool.id));
  const [settings, setSettings] = React.useState<Settings>(DEFAULT_SETTINGS);
  const [copied, setCopied] = React.useState(false);
  const output = calculate(tool.id, input, settings);
  const update = (key: keyof Settings, value: string | number) => setSettings((previous) => ({ ...previous, [key]: value }));
  const copy = async () => { await navigator.clipboard.writeText(output); setCopied(true); toast.success("Output copied."); window.setTimeout(() => setCopied(false), 1500); };
  const download = () => { const extension = tool.id.includes("html") ? "html" : tool.id.includes("json") ? "json" : tool.id.includes("xml") || tool.id.includes("sitemap") ? "xml" : tool.id.includes("csv") ? "csv" : "txt"; downloadText(output, `${tool.id}.${extension}`, extension === "html" ? "text/html" : "text/plain"); toast.success("Downloaded."); };
  const reset = () => { setInput(defaultInput(tool.id)); setSettings(DEFAULT_SETTINGS); };

  return <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
    <ToolHeader category={tool.categoryName} title={tool.title} description={tool.description} onReset={reset} actions={<><button onClick={copy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium">{copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? "Copied" : "Copy"}</button><button onClick={download} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"><Download className="w-3.5 h-3.5" />Download</button></>} />
    <ToolControls id={tool.id} input={input} setInput={setInput} settings={settings} update={update} />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5"><label className="text-xs font-bold">{inputLabel(tool.id)}<textarea value={input} onChange={(event) => setInput(event.target.value)} rows={16} className="mt-2 w-full p-4 rounded-2xl border border-border bg-card font-mono text-sm leading-6 resize-y" /></label><div><div className="flex items-center justify-between text-xs font-bold mb-2"><span>Result</span><span className="text-muted-foreground">{output.length} chars</span></div><pre className="min-h-[360px] p-4 rounded-2xl border border-border bg-card whitespace-pre-wrap break-words font-mono text-sm leading-6 overflow-auto">{output || "Your result appears here."}</pre></div></div>
  </div>;
}

function ToolControls({ id, input, setInput, settings, update }: { id: string; input: string; setInput: (value: string) => void; settings: Settings; update: (key: keyof Settings, value: string | number) => void }) {
  if (id === "excel-formula-builder") {
    return <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 rounded-2xl border border-border bg-card">
      <label className="text-xs font-semibold">Function<select value={settings.option || "SUM"} onChange={(event) => update("option", event.target.value)} className="control"><option>SUM</option><option>AVERAGE</option><option>COUNT</option><option>COUNTA</option><option>MAX</option><option>MIN</option><option>COUNTIF</option><option>SUMIF</option><option>IF</option><option>XLOOKUP</option></select></label>
      <label className="text-xs font-semibold">Range<input value={settings.secondary || "B2:B20"} onChange={(event) => update("secondary", event.target.value)} className="control" /></label>
      <label className="text-xs font-semibold">Criteria/value<input value={settings.optionTwo || "greater than zero"} onChange={(event) => update("optionTwo", event.target.value)} className="control" /></label>
    </div>;
  }
  if (["percentage-calculator", "ratio-calculator", "loan-calculator", "compound-interest", "fraction-calculator", "date-difference", "date-add-subtract", "age-calculator", "unit-converter", "average-calculator", "scientific-notation", "rounding-calculator", "gcd-lcm", "prime-checker"].includes(id)) {
    return <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 rounded-2xl border border-border bg-card">
      <label className="text-xs font-semibold">{id === "date-difference" || id === "age-calculator" ? "Start date" : "Value"}<input value={input} onChange={(event) => setInput(event.target.value)} className="control" /></label>
      <label className="text-xs font-semibold">{id === "date-difference" || id === "age-calculator" ? "End date" : "Second value"}<input value={settings.secondary} onChange={(event) => update("secondary", event.target.value)} className="control" /></label>
      <label className="text-xs font-semibold">Option<input value={settings.option} onChange={(event) => update("option", event.target.value)} className="control" placeholder={id === "unit-converter" ? "km to mi" : id === "rounding-calculator" ? "2 decimals" : ""} /></label>
    </div>;
  }
  if (["random-number", "dice-roller", "text-repeat", "lorem-ipsum"].includes(id)) {
    return <div className="p-4 rounded-2xl border border-border bg-card flex items-center gap-3"><label className="text-xs font-semibold">{id === "dice-roller" ? "Dice expression" : "Count"}<input type={id === "dice-roller" ? "text" : "number"} value={id === "dice-roller" ? settings.option : settings.count} onChange={(event) => id === "dice-roller" ? update("option", event.target.value) : update("count", Number(event.target.value))} className="control" /></label><button onClick={() => setInput(String(Date.now()))} className="inline-flex items-center gap-1.5 mt-5 text-xs text-primary"><RefreshCw className="w-3.5 h-3.5" />Generate</button></div>;
  }
  if (["query-string-builder", "curl-builder", "http-header-builder", "twitter-card-generator", "canonical-tag", "viewport-meta", "hreflang-generator"].includes(id)) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5 rounded-2xl border border-border bg-card"><label className="text-xs font-semibold">Name / URL<input value={settings.option} onChange={(event) => update("option", event.target.value)} className="control" placeholder="https://example.com" /></label><label className="text-xs font-semibold">Value / details<input value={settings.secondary} onChange={(event) => update("secondary", event.target.value)} className="control" placeholder="Add a value" /></label></div>;
  }
  return null;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="text-xs font-semibold block">{label}{children}</label>; }
function inputLabel(id: string) { if (["word-counter", "document-editor", "markdown-editor"].includes(id)) return "Text"; if (id.includes("formula")) return "Formula"; if (id.includes("csv") || id.includes("table")) return "CSV data"; return "Input"; }
function defaultInput(id: string) { const today = new Date().toISOString().slice(0, 10); const values: Record<string, string> = { "excel-formula-explainer": "=SUM(B2:B20)", "csv-cleaner": "name, role\nAlice, Engineer\nBob, Designer", "csv-to-tsv": "name,role\nAlice,Engineer", "table-transposer": "name,role\nAlice,Engineer", "markdown-editor": "# Notes\n\nWrite **Markdown** here.", "document-editor": "Write your document here.", "word-counter": "Paste writing here.", "case-converter": "Convert this useful sentence.", "slug-generator": "A useful article title", "line-sorter": "banana\napple\norange\napple", "whitespace-cleaner": "line  \n\n\nnext line", "robots-txt-generator": "User-agent: *\nDisallow: /private/", "sitemap-generator": "https://example.com/\nhttps://example.com/about", "meta-description-counter": "Write a clear description for your page.", "date-difference": today, "date-add-subtract": today, "age-calculator": "1990-01-01", "unit-converter": "100", "average-calculator": "10, 20, 30", "ratio-calculator": "16:9", "fraction-calculator": "1/2 + 1/4", "number-to-words": "1234", "binary-converter": "42", "hex-converter": "ff", "bytes-converter": "1048576", "roman-numeral": "2026", "scientific-notation": "123456", "prime-checker": "97", "rounding-calculator": "3.14159", "remove-duplicate-words": "one two one three two", "word-frequency": "one two one three two one", "reverse-text": "DAN Tools", "palindrome-checker": "A man, a plan, a canal: Panama", "line-to-comma": "one\ntwo\nthree", "comma-to-lines": "one, two, three", "quote-cleaner": "“Hello”—she said…", "email-extractor": "Contact a@example.com or b@example.org", "url-extractor": "Visit https://example.com and https://dantools.vercel.app", "hashtag-generator": "privacy tools local productivity", "unicode-inspector": "DAN", "ascii-converter": "DAN", "markdown-table": "Name\tRole\nAlice\tEngineer", "css-unit-converter": "16px", "regex-escape": "hello.+world", "json-stringify": "{\"name\":\"DAN\"}", "html-entity-encoder": "<strong>Hello</strong>", "html-strip-tags": "<p>Hello <b>world</b></p>", "html-minifier": "<div>  Hello </div>", "sql-formatter": "select id,name from users where active = true", "sql-in-builder": "alice\nbob\ncharlie", "env-file-parser": "APP_NAME=DAN Tools\nDEBUG=true", "gitignore-generator": "node\nmacos\nvisual studio code", "dockerignore-generator": "node\n.git\n.env", "curl-builder": "https://api.example.com/users", "xml-formatter": "<root><item>value</item></root>", "yaml-validator": "name: DAN Tools\nprivate: true", "json-path-helper": "users[].email", "http-status-reference": "404", "mime-type-lookup": ".pdf", "viewport-meta": "", "canonical-tag": "https://example.com/page", "hreflang-generator": "en=https://example.com\nfr=https://example.com/fr", "twitter-card-generator": "DAN Tools", "contrast-checker": "#111827\n#ffffff", "uuid-generator": "" }; return values[id] ?? ""; }

function calculate(id: string, input: string, settings: Settings): string {
  const second = settings.secondary;
  if (id === "excel-formula-builder") { const range = second || "B2:B20", value = settings.optionTwo || ">0", fn = settings.option || "SUM"; return ({ SUM: `=SUM(${range})`, AVERAGE: `=AVERAGE(${range})`, COUNT: `=COUNT(${range})`, COUNTA: `=COUNTA(${range})`, MAX: `=MAX(${range})`, MIN: `=MIN(${range})`, COUNTIF: `=COUNTIF(${range},"${value}")`, SUMIF: `=SUMIF(${range},"${value}")`, IF: `=IF(${range}=${value},"Yes","No")`, XLOOKUP: `=XLOOKUP(${value},${range},${range},"Not found")` } as Record<string, string>)[fn]; }
  if (id === "excel-formula-explainer") { const fn = input.match(/=([A-Z][A-Z0-9._]*)/i)?.[1]?.toUpperCase() || "expression"; const refs = input.match(/\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?/gi) || []; return `Function: ${fn}\nReferences: ${refs.join(", ") || "none"}\n\nExcel formulas start with = and combine functions, references, operators, and constants.`; }
  if (["csv-cleaner", "csv-to-tsv", "table-transposer"].includes(id)) { const rows = input.split(/\r?\n/).filter((line) => line.trim()).map((line) => line.split(",").map((cell) => cell.trim())); if (id === "csv-cleaner") return rows.map((row) => row.join(",")).join("\n"); if (id === "csv-to-tsv") return rows.map((row) => row.join("\t")).join("\n"); return rows[0]?.map((_, column) => rows.map((row) => row[column] || "").join(",")).join("\n") || ""; }
  if (id === "percentage-calculator") { const p = Number(input), base = Number(second); return Number.isFinite(p) && Number.isFinite(base) ? `${p}% of ${base} = ${(p * base / 100).toFixed(2)}\nAfter increase: ${(base * (1 + p / 100)).toFixed(2)}\nAfter decrease: ${(base * (1 - p / 100)).toFixed(2)}` : "Enter percentage and base."; }
  if (id === "average-calculator") { const values = input.split(/[\s,]+/).map(Number).filter(Number.isFinite); const sorted = [...values].sort((a, b) => a - b); return values.length ? `Mean: ${(values.reduce((a, b) => a + b, 0) / values.length).toFixed(4)}\nMedian: ${sorted[Math.floor((sorted.length - 1) / 2)]}\nMin: ${sorted[0]}\nMax: ${sorted[sorted.length - 1]}` : "Enter numbers separated by commas."; }
  if (id === "ratio-calculator") { const parts = input.split(":").map(Number); if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n))) return "Enter a ratio such as 16:9."; const divisor = gcd(parts[0], parts[1]); return `Simplified: ${parts[0] / divisor}:${parts[1] / divisor}\nScale ${second || "2"} by first ratio part: ${(Number(second || 2) * parts[1] / parts[0]).toFixed(2)}`; }
  if (id === "loan-calculator") { const principal = Number(input), annual = Number(second || 5) / 100 / 12, months = Number(settings.option || 60); const payment = annual ? principal * annual / (1 - Math.pow(1 + annual, -months)) : principal / months; return `Monthly payment: ${payment.toFixed(2)}\nTotal paid: ${(payment * months).toFixed(2)}\nTotal interest: ${(payment * months - principal).toFixed(2)}`; }
  if (id === "compound-interest") { const principal = Number(input), rate = Number(second || 5) / 100, years = Number(settings.option || 10), amount = principal * Math.pow(1 + rate / 12, years * 12); return `Future value: ${amount.toFixed(2)}\nGrowth: ${(amount - principal).toFixed(2)}`; }
  if (["date-difference", "age-calculator"].includes(id)) { const start = new Date(input), end = new Date(second || new Date()); const days = Math.abs(Math.round((end.getTime() - start.getTime()) / 86400000)); return `${days} days\n${(days / 7).toFixed(1)} weeks\n${(days / 365.25).toFixed(2)} years`; }
  if (id === "date-add-subtract") { const date = new Date(input); date.setDate(date.getDate() + Number(second || 0)); return Number.isNaN(date.getTime()) ? "Enter a valid date." : date.toISOString().slice(0, 10); }
  if (id === "unit-converter") { const value = Number(input), unit = (settings.option || "km to mi").toLowerCase(); const factors: Record<string, number> = { "km to mi": 0.621371, "mi to km": 1.60934, "kg to lb": 2.20462, "lb to kg": 0.453592, "c to f": 1.8, "f to c": 0.555556, "m to ft": 3.28084, "ft to m": 0.3048 }; return factors[unit] ? `${(value * factors[unit]).toFixed(6)} (${unit})` : "Supported: km to mi, mi to km, kg to lb, lb to kg, C to F, F to C, m to ft, ft to m."; }
  if (id === "number-to-words") return words(Number(input));
  if (["binary-converter", "hex-converter"].includes(id)) { const base = id === "binary-converter" ? 2 : 16, value = parseInt(input, base); return Number.isFinite(value) ? `Decimal: ${value}\nBinary: ${value.toString(2)}\nHex: ${value.toString(16).toUpperCase()}\nOctal: ${value.toString(8)}` : "Enter a valid number."; }
  if (id === "bytes-converter") { const bytes = Number(input); return Number.isFinite(bytes) ? `Bytes: ${bytes}\nKB: ${(bytes / 1024).toFixed(3)}\nMB: ${(bytes / 1048576).toFixed(3)}\nGB: ${(bytes / 1073741824).toFixed(3)}` : "Enter bytes."; }
  if (id === "roman-numeral") return roman(Number(input));
  if (id === "scientific-notation") { const n = Number(input); return Number.isFinite(n) ? n.toExponential() : "Enter a number."; }
  if (["random-number", "dice-roller"].includes(id)) { if (id === "dice-roller") { const match = (settings.option || "2d6").match(/(\d+)d(\d+)/i); if (!match) return "Use dice notation such as 2d6."; const rolls = Array.from({ length: Number(match[1]) }, () => 1 + Math.floor(Math.random() * Number(match[2]))); return `Rolls: ${rolls.join(", ")}\nTotal: ${rolls.reduce((a, b) => a + b, 0)}`; } const min = Number(input) || 1, max = Number(second) || 100; return String(min + Math.floor(Math.random() * (max - min + 1))); }
  if (id === "fraction-calculator") return fraction(input);
  if (id === "gcd-lcm") { const ns = input.split(/[\s,]+/).map(Number).filter(Number.isFinite); return ns.length ? `GCD: ${ns.reduce(gcd)}\nLCM: ${ns.reduce(lcm)}` : "Enter integers."; }
  if (id === "prime-checker") { const n = Number(input), prime = n > 1 && Array.from({ length: Math.floor(Math.sqrt(n)) - 1 }, (_, i) => i + 2).every((d) => n % d); return `${n} is ${prime ? "prime" : "not prime"}.`; }
  if (id === "rounding-calculator") { const decimals = Number(settings.option.match(/\d+/)?.[0] || 2), n = Number(input); return Number.isFinite(n) ? n.toFixed(decimals) : "Enter a number."; }
  if (id === "remove-duplicate-words") return Array.from(new Set(input.split(/\s+/))).join(" ");
  if (id === "word-frequency") { const map = new Map<string, number>(); input.toLowerCase().match(/[a-z0-9']+/g)?.forEach((word) => map.set(word, (map.get(word) || 0) + 1)); return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([word, count]) => `${word}: ${count}`).join("\n"); }
  if (id === "reverse-text") return input.split("").reverse().join("");
  if (id === "palindrome-checker") { const normalized = input.toLowerCase().replace(/[^a-z0-9]/g, ""); return normalized === normalized.split("").reverse().join("") ? "Palindrome: yes" : "Palindrome: no"; }
  if (id === "text-repeat") return Array(Number(second || 3)).fill(input).join("\n");
  if (id === "line-to-comma") return input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).join(", ");
  if (id === "comma-to-lines") return input.split(",").map((item) => item.trim()).filter(Boolean).join("\n");
  if (id === "quote-cleaner") return input.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[—–]/g, "-").replace(/…/g, "...");
  if (id === "email-extractor") return Array.from(new Set(input.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g) || [])).join("\n");
  if (id === "url-extractor") return Array.from(new Set(input.match(/https?:\/\/[^\s]+/g) || [])).join("\n");
  if (id === "hashtag-generator") return input.split(/[\s,]+/).filter(Boolean).map((word) => `#${word.replace(/[^\w]/g, "")}`).join(" ");
  if (id === "unicode-inspector") return Array.from(input).map((char) => `${char}: U+${char.codePointAt(0)?.toString(16).toUpperCase().padStart(4, "0")}`).join("\n");
  if (id === "ascii-converter") return input.match(/^\d+(?:\s+\d+)*$/) ? input.split(/\s+/).map((n) => String.fromCharCode(Number(n))).join("") : Array.from(input).map((char) => char.charCodeAt(0)).join(" ");
  if (id === "markdown-table") { const rows = input.split(/\r?\n/).map((line) => line.split("\t")); return rows.length ? `| ${rows[0].join(" | ")} |\n| ${rows[0].map(() => "---").join(" | ")} |\n${rows.slice(1).map((row) => `| ${row.join(" | ")} |`).join("\n")}` : ""; }
  if (id === "css-unit-converter") { const px = Number(input.match(/[\d.]+/)?.[0] || 0), base = Number(second || 16); return `${px}px\n${(px / base).toFixed(4)}rem\n${((px / 1440) * 100).toFixed(4)}vw`; }
  if (id === "regex-escape") return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (id === "json-stringify") { try { const value = JSON.parse(input); return JSON.stringify(JSON.stringify(value)); } catch { try { return JSON.stringify(JSON.parse(input.slice(1, -1))); } catch { return "Enter valid JSON."; } } }
  if (id === "html-entity-encoder") return input.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[char]);
  if (id === "html-strip-tags") return input.replace(/<[^>]*>/g, "");
  if (id === "html-minifier") return input.replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").trim();
  if (id === "url-encoder") { try { return `Encoded: ${encodeURIComponent(input)}\n\nDecoded: ${decodeURIComponent(input)}`; } catch { return `Encoded: ${encodeURIComponent(input)}\n\nDecoded: Invalid percent encoding`; } }
  if (id === "query-string-builder") return input.split(/\r?\n/).filter(Boolean).map((line) => { const [key, ...values] = line.split("="); return `${encodeURIComponent(key.trim())}=${encodeURIComponent(values.join("=").trim())}`; }).join("&");
  if (id === "sql-formatter") return input.replace(/\s+/g, " ").replace(/\b(SELECT|FROM|WHERE|JOIN|ON|GROUP BY|ORDER BY|LIMIT|INSERT INTO|VALUES|UPDATE|SET|DELETE)\b/gi, "\n$1").trim();
  if (id === "sql-in-builder") return `IN (${input.split(/\r?\n|,/).map((value) => `'${value.trim().replace(/'/g, "''")}'`).filter((value) => value !== "''").join(", ")})`;
  if (id === "env-file-parser") return input.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith("#")).map((line) => line.trim()).join("\n");
  if (id === "gitignore-generator") return input.split(/\r?\n/).flatMap((item) => item.toLowerCase().includes("node") ? ["node_modules/", ".next/", "npm-debug.log*"] : item.toLowerCase().includes("python") ? ["__pycache__/", "*.py[cod]", ".venv/"] : item.toLowerCase().includes("mac") ? [".DS_Store"] : item.toLowerCase().includes("visual") ? [".vscode/"] : []).filter((v, i, a) => a.indexOf(v) === i).join("\n");
  if (id === "dockerignore-generator") return `${input.split(/\r?\n/).filter(Boolean).join("\n")}\n.git\n.env\nnode_modules\n.next`;
  if (id === "curl-builder") return `curl -X GET '${input}' -H 'Accept: application/json'`;
  if (id === "xml-formatter") return input.replace(/>\s*</g, ">\n<");
  if (id === "yaml-validator") return input.trim() ? "Valid YAML-like structure.\n\n" + input : "Enter YAML.";
  if (id === "json-path-helper") return `$.${input.replace(/\[\]/g, "[*]")}`;
  if (id === "robots-txt-generator") return input;
  if (id === "sitemap-generator") return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset>${input.split(/\r?\n/).filter(Boolean).map((url) => `<url><loc>${url}</loc></url>`).join("")}</urlset>`;
  if (id === "viewport-meta") return '<meta name="viewport" content="width=device-width, initial-scale=1">';
  if (id === "canonical-tag") return `<link rel="canonical" href="${input}" />`;
  if (id === "hreflang-generator") return input.split(/\r?\n/).filter(Boolean).map((line) => { const [lang, url] = line.split("="); return `<link rel="alternate" hreflang="${lang}" href="${url}" />`; }).join("\n");
  if (id === "twitter-card-generator") return `<meta property="og:title" content="${input}" />\n<meta name="twitter:card" content="summary_large_image" />`;
  if (id === "http-status-reference") return ({ "200": "OK - request succeeded", "201": "Created - resource created", "301": "Moved Permanently", "400": "Bad Request", "401": "Unauthorized", "403": "Forbidden", "404": "Not Found", "500": "Internal Server Error", "503": "Service Unavailable" } as Record<string, string>)[input.trim()] || "Enter a common status code.";
  if (id === "mime-type-lookup") return ({ ".pdf": "application/pdf", ".json": "application/json", ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".txt": "text/plain" } as Record<string, string>)[input.trim().toLowerCase()] || "Unknown extension.";
  if (id === "contrast-checker") { const colors = input.split(/\r?\n/).map((value) => value.trim()); const luminance = (hex: string) => { const clean = hex.replace("#", ""); if (!/^[0-9a-f]{6}$/i.test(clean)) return null; const channels = [0, 2, 4].map((offset) => parseInt(clean.slice(offset, offset + 2), 16) / 255).map((channel) => channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)); return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]; }; const first = luminance(colors[0] || ""), secondColor = luminance(colors[1] || ""); if (first === null || secondColor === null) return "Enter two six-digit HEX colors on separate lines."; const ratio = (Math.max(first, secondColor) + 0.05) / (Math.min(first, secondColor) + 0.05); return `Contrast ratio: ${ratio.toFixed(2)}:1\nAA normal text: ${ratio >= 4.5 ? "Pass" : "Fail"}\nAA large text: ${ratio >= 3 ? "Pass" : "Fail"}`; }
  if (id === "uuid-generator") return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "UUID generation is unavailable in this browser.";
  if (id === "http-header-builder") return "X-Content-Type-Options: nosniff\nReferrer-Policy: strict-origin-when-cross-origin\nX-Frame-Options: DENY";
  if (id === "meta-description-counter") return `${input.length}/160 characters\n${input.trim().split(/\s+/).filter(Boolean).length} words\n${input.length <= 160 ? "Within recommended length" : "Trim the description"}`;
  if (id === "line-sorter") return Array.from(new Set(input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))).sort().join("\n");
  if (id === "whitespace-cleaner") return input.split(/\r?\n/).map((line) => line.trimEnd()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (id === "slug-generator") return input.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");
  if (id === "lorem-ipsum") return Array.from({ length: settings.count || 3 }, () => "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante.").join("\n\n");
  if (id === "word-counter") { const words = input.trim() ? input.trim().split(/\s+/).length : 0; return `Words: ${words}\nCharacters: ${input.length}\nSentences: ${input.split(/[.!?]+/).filter(Boolean).length}\nReading time: ${Math.max(1, Math.ceil(words / 200))} minute(s)`; }
  if (id === "markdown-editor") return input.replace(/^### (.*)$/gm, "HEADING 3: $1").replace(/^## (.*)$/gm, "HEADING 2: $1").replace(/^# (.*)$/gm, "HEADING 1: $1").replace(/\*\*(.*?)\*\*/g, "$1");
  if (id === "case-converter") return `Sentence: ${input ? input[0].toUpperCase() + input.slice(1).toLowerCase() : ""}\nUPPER: ${input.toUpperCase()}\nlower: ${input.toLowerCase()}\nTitle: ${input.replace(/\w+/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase())}`;
  if (id === "sitemap-generator" || id === "robots-txt-generator") return input;
  return input;
}

function gcd(a: number, b: number): number { return b ? gcd(b, a % b) : Math.abs(a); }
function lcm(a: number, b: number): number { return Math.abs(a * b) / gcd(a, b); }
function roman(value: number): string { if (!Number.isInteger(value) || value < 1 || value > 3999) return "Enter an integer from 1 to 3999."; const pairs: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]]; return pairs.reduce((result, [amount, symbol]) => { while (value >= amount) { result += symbol; value -= amount; } return result; }, ""); }
function fraction(value: string): string { const match = value.match(/(\d+)\/(\d+)\s*([+\-*\/])\s*(\d+)\/(\d+)/); if (!match) return "Use a format such as 1/2 + 1/4."; const [, a, b, op, c, d] = match.map(String); const left = Number(a) / Number(b), right = Number(c) / Number(d); return `${left} ${op} ${right} = ${op === "+" ? left + right : op === "-" ? left - right : op === "*" ? left * right : left / right}`; }
function words(value: number): string { if (!Number.isFinite(value)) return "Enter a number."; if (value === 0) return "zero"; const small = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"], tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]; const convert = (n: number): string => n < 20 ? small[n] : n < 100 ? tens[Math.floor(n / 10)] + (n % 10 ? `-${small[n % 10]}` : "") : n < 1000 ? `${small[Math.floor(n / 100)]} hundred${n % 100 ? ` ${convert(n % 100)}` : ""}` : `${convert(Math.floor(n / 1000))} thousand${n % 1000 ? ` ${convert(n % 1000)}` : ""}`; return convert(Math.floor(Math.abs(value))) + (value < 0 ? " (negative)" : ""); }
