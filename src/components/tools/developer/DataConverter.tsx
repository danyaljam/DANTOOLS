"use client";

import * as React from "react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import yaml from "js-yaml";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  Copy,
  Check,
  Download,
  FileCode,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { downloadText } from "@/lib/utils";

type DataFormat = "json" | "csv" | "yaml";

const SAMPLE_DATA: Record<DataFormat, string> = {
  json: JSON.stringify(
    [
      { id: 1, name: "Alice Smith", role: "Engineering Lead", active: true, email: "alice@example.com" },
      { id: 2, name: "Bob Jones", role: "Product Designer", active: false, email: "bob@example.com" },
      { id: 3, name: "Charlie Day", role: "Security Architect", active: true, email: "charlie@example.com" },
    ],
    null,
    2
  ),
  csv: `id,name,role,active,email
1,Alice Smith,Engineering Lead,true,alice@example.com
2,Bob Jones,Product Designer,false,bob@example.com
3,Charlie Day,Security Architect,true,charlie@example.com`,
  yaml: `users:
  - id: 1
    name: Alice Smith
    role: Engineering Lead
    active: true
    email: alice@example.com
  - id: 2
    name: Bob Jones
    role: Product Designer
    active: false
    email: bob@example.com`,
};

export function DataConverter() {
  const [sourceFormat, setSourceFormat] = React.useState<DataFormat>("json");
  const [targetFormat, setTargetFormat] = React.useState<DataFormat>("yaml");
  const [inputData, setInputData] = React.useState<string>(SAMPLE_DATA.json);
  const [outputData, setOutputData] = React.useState<string>("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [indentSpaces, setIndentSpaces] = React.useState<number>(2);
  const [copied, setCopied] = React.useState(false);

  // Parse CSV string into array of objects
  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // Simple regex for CSV split respecting quotes
      const values = line.split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
      const obj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        let val: any = values[idx] ?? "";
        if (val === "true") val = true;
        else if (val === "false") val = false;
        else if (!isNaN(Number(val)) && val !== "") val = Number(val);
        obj[h] = val;
      });
      records.push(obj);
    }
    return records;
  };

  // Convert array of objects or object to CSV
  const jsonToCSV = (data: any): string => {
    const arr = Array.isArray(data) ? data : [data];
    if (arr.length === 0) return "";

    // Collect all unique keys
    const keys = Array.from(new Set(arr.flatMap((item) => Object.keys(item))));
    const headerRow = keys.join(",");
    const rows = arr.map((item) =>
      keys
        .map((k) => {
          const val = item[k] ?? "";
          if (typeof val === "object") return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          if (typeof val === "string" && (val.includes(",") || val.includes('"') || val.includes("\n"))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return `${val}`;
        })
        .join(",")
    );

    return [headerRow, ...rows].join("\n");
  };

  // Conversion effect
  React.useEffect(() => {
    if (!inputData.trim()) {
      setOutputData("");
      setErrorMessage(null);
      return;
    }

    try {
      setErrorMessage(null);
      let parsed: any;

      // 1. Parse Input
      if (sourceFormat === "json") {
        parsed = JSON.parse(inputData);
      } else if (sourceFormat === "csv") {
        parsed = parseCSV(inputData);
      } else if (sourceFormat === "yaml") {
        parsed = yaml.load(inputData);
      }

      // 2. Generate Output
      let result = "";
      if (targetFormat === "json") {
        result = JSON.stringify(parsed, null, indentSpaces);
      } else if (targetFormat === "csv") {
        result = jsonToCSV(parsed);
      } else if (targetFormat === "yaml") {
        result = yaml.dump(parsed, { indent: indentSpaces, noRefs: true });
      }

      setOutputData(result);
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid syntax");
      setOutputData("");
    }
  }, [inputData, sourceFormat, targetFormat, indentSpaces]);

  const swapFormats = () => {
    const oldSource = sourceFormat;
    const oldTarget = targetFormat;
    setSourceFormat(oldTarget);
    setTargetFormat(oldSource);
    setInputData(outputData || SAMPLE_DATA[oldTarget]);
    toast.info(`Swapped: ${oldTarget.toUpperCase()} ↔ ${oldSource.toUpperCase()}`);
  };

  const copyOutput = () => {
    if (!outputData) return;
    navigator.clipboard.writeText(outputData);
    setCopied(true);
    toast.success("Converted data copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadOutput = () => {
    if (!outputData) return;
    const ext = targetFormat === "json" ? "json" : targetFormat === "csv" ? "csv" : "yaml";
    const mime =
      targetFormat === "json"
        ? "application/json"
        : targetFormat === "csv"
        ? "text/csv"
        : "text/yaml";
    downloadText(outputData, `converted_data.${ext}`, mime);
    toast.success(`Downloaded converted_data.${ext}!`);
  };

  const loadSample = () => {
    setInputData(SAMPLE_DATA[sourceFormat]);
    toast.info(`Loaded ${sourceFormat.toUpperCase()} sample`);
  };

  const minifyJson = () => {
    if (sourceFormat === "json") {
      try {
        const obj = JSON.parse(inputData);
        setInputData(JSON.stringify(obj));
        toast.success("JSON Minified!");
      } catch {
        toast.error("Cannot minify invalid JSON");
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="Developer & Data"
        title="JSON / CSV / YAML Converter"
        description="Bidirectional client-side data converter with syntax validation, formatting controls, and instant download."
        onReset={() => {
          setInputData(SAMPLE_DATA.json);
          setSourceFormat("json");
          setTargetFormat("yaml");
        }}
      />

      {/* Control Strip */}
      <div className="p-4 rounded-2xl border border-border bg-card flex flex-wrap items-center justify-between gap-4 shadow-xs mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Source Format */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase">From:</span>
            <div className="flex rounded-lg border border-border bg-muted p-0.5">
              {(["json", "csv", "yaml"] as DataFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setSourceFormat(f);
                    setInputData(SAMPLE_DATA[f]);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-md uppercase transition-all ${
                    sourceFormat === f
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Swap Button */}
          <button
            onClick={swapFormats}
            className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Swap source and target formats"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          {/* Target Format */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase">To:</span>
            <div className="flex rounded-lg border border-border bg-muted p-0.5">
              {(["json", "csv", "yaml"] as DataFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setTargetFormat(f)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md uppercase transition-all ${
                    targetFormat === f
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Indentation / Helper Actions */}
        <div className="flex items-center gap-2">
          {targetFormat !== "csv" && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Indent:</span>
              <select
                value={indentSpaces}
                onChange={(e) => setIndentSpaces(parseInt(e.target.value, 10))}
                className="px-2 py-1 rounded-md border border-border bg-background text-xs font-medium"
              >
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
              </select>
            </div>
          )}

          {sourceFormat === "json" && (
            <button
              onClick={minifyJson}
              className="px-2.5 py-1 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Minify Input
            </button>
          )}

          <button
            onClick={loadSample}
            className="px-2.5 py-1 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Load Sample
          </button>
        </div>
      </div>

      {/* Error alert if syntax error */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-mono">{errorMessage}</span>
        </div>
      )}

      {/* Editor Grid: 2 textareas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold uppercase tracking-wider text-foreground">
              Input ({sourceFormat.toUpperCase()})
            </span>
            <span>{inputData.length} characters</span>
          </div>

          <textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder={`Enter or paste your ${sourceFormat.toUpperCase()} here...`}
            rows={20}
            spellCheck={false}
            className="w-full p-4 rounded-2xl border border-border bg-card text-foreground font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary shadow-xs resize-none"
          />
        </div>

        {/* Output Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold uppercase tracking-wider text-primary">
              Output ({targetFormat.toUpperCase()})
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={copyOutput}
                disabled={!outputData}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-border hover:bg-muted text-foreground transition-colors disabled:opacity-40"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>

              <button
                onClick={downloadOutput}
                disabled={!outputData}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-primary text-primary-foreground font-medium shadow-xs hover:bg-primary/90 transition-all disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          <textarea
            value={outputData}
            readOnly
            placeholder="Converted output will appear here automatically..."
            rows={20}
            spellCheck={false}
            className="w-full p-4 rounded-2xl border border-border bg-muted/20 text-foreground font-mono text-xs leading-relaxed focus:outline-none shadow-inner resize-none select-all"
          />
        </div>
      </div>
    </div>
  );
}

