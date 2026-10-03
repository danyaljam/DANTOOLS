"use client";

import * as React from "react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { toast } from "sonner";
import {
  KeyRound,
  FileCode,
  Copy,
  Check,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowLeftRight,
} from "lucide-react";
import { downloadBlob } from "@/lib/utils";

const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRhbnlhbCBKYW1pbCIsImFkbWluIjp0cnVlLCJpYXQiOjE3Mzg0NTQ0MDAsImV4cCI6MTgwMDAwMDAwMH0." +
  "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export function JwtBase64Decoder() {
  const [activeTab, setActiveTab] = React.useState<"jwt" | "base64">("jwt");

  // JWT State
  const [jwtToken, setJwtToken] = React.useState<string>(SAMPLE_JWT);
  const [jwtHeader, setJwtHeader] = React.useState<any>(null);
  const [jwtPayload, setJwtPayload] = React.useState<any>(null);
  const [jwtSignature, setJwtSignature] = React.useState<string>("");
  const [jwtError, setJwtError] = React.useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = React.useState<{
    expired: boolean;
    expiresAt?: Date;
    issuedAt?: Date;
    timeRemaining?: string;
  }>({ expired: false });

  // Base64 State
  const [b64Mode, setB64Mode] = React.useState<"text" | "file">("text");
  const [b64Direction, setB64Direction] = React.useState<"encode" | "decode">("decode");
  const [b64Input, setB64Input] = React.useState<string>(
    "SGVsbG8sIExvY2FsVG9vbHMgLSBQcml2YXRlIGFuZCBMb2NhbCEg8J+agA=="
  );
  const [b64Output, setB64Output] = React.useState<string>("");
  const [b64Error, setB64Error] = React.useState<string | null>(null);

  const [copiedPayload, setCopiedPayload] = React.useState(false);
  const [copiedB64, setCopiedB64] = React.useState(false);

  // Safe base64url decode
  const base64UrlDecode = (str: string) => {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  };

  // JWT parsing
  React.useEffect(() => {
    const trimmed = jwtToken.trim();
    if (!trimmed) {
      setJwtHeader(null);
      setJwtPayload(null);
      setJwtSignature("");
      setJwtError(null);
      return;
    }

    try {
      const parts = trimmed.split(".");
      if (parts.length !== 3) {
        throw new Error("A valid JWT must contain exactly 3 dot-separated segments (Header, Payload, Signature)");
      }

      const headerJson = JSON.parse(base64UrlDecode(parts[0]));
      const payloadJson = JSON.parse(base64UrlDecode(parts[1]));
      const sig = parts[2];

      setJwtHeader(headerJson);
      setJwtPayload(payloadJson);
      setJwtSignature(sig);
      setJwtError(null);

      // Analyze expiration
      if (payloadJson.exp) {
        const expDate = new Date(payloadJson.exp * 1000);
        const now = new Date();
        const isExp = now.getTime() > expDate.getTime();

        const diffMs = expDate.getTime() - now.getTime();
        let remaining = "";
        if (!isExp) {
          const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          remaining = `${days > 0 ? `${days}d ` : ""}${hours}h ${minutes}m remaining`;
        }

        setTokenStatus({
          expired: isExp,
          expiresAt: expDate,
          issuedAt: payloadJson.iat ? new Date(payloadJson.iat * 1000) : undefined,
          timeRemaining: remaining,
        });
      } else {
        setTokenStatus({ expired: false });
      }
    } catch (err: any) {
      setJwtError(err.message || "Failed to decode JWT token");
      setJwtHeader(null);
      setJwtPayload(null);
      setJwtSignature("");
    }
  }, [jwtToken]);

  // Base64 Text conversion
  React.useEffect(() => {
    if (b64Mode !== "text") return;
    if (!b64Input) {
      setB64Output("");
      setB64Error(null);
      return;
    }

    try {
      setB64Error(null);
      if (b64Direction === "encode") {
        const bytes = new TextEncoder().encode(b64Input);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        setB64Output(btoa(binary));
      } else {
        const binary = atob(b64Input.trim().replace(/\s/g, ""));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        setB64Output(new TextDecoder().decode(bytes));
      }
    } catch (err: any) {
      setB64Error(err.message || "Base64 processing error");
      setB64Output("");
    }
  }, [b64Input, b64Direction, b64Mode]);

  // Handle Base64 File drop
  const handleBase64FileAdded = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setB64Output(dataUrl);
      toast.success(`Converted ${file.name} to Base64 Data URL!`);
    };
    reader.readAsDataURL(file);
  };

  const copyPayload = () => {
    if (!jwtPayload) return;
    navigator.clipboard.writeText(JSON.stringify(jwtPayload, null, 2));
    setCopiedPayload(true);
    toast.success("Payload claims copied!");
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const copyB64Output = () => {
    if (!b64Output) return;
    navigator.clipboard.writeText(b64Output);
    setCopiedB64(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedB64(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="Developer & Data"
        title="Base64 & JWT Decoder"
        description="Inspect and validate JSON Web Token claims, check token expirations, and encode/decode Base64 strings or files."
        onReset={() => {
          setJwtToken(SAMPLE_JWT);
          setB64Input("SGVsbG8sIExvY2FsVG9vbHMgLSBQcml2YXRlIGFuZCBMb2NhbCEg8J+agA==");
        }}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-4 mb-6">
        <button
          onClick={() => setActiveTab("jwt")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "jwt"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>JWT Token Inspector</span>
        </button>

        <button
          onClick={() => setActiveTab("base64")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "base64"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Base64 Text & File Converter</span>
        </button>
      </div>

      {/* Tab 1: JWT Inspector */}
      {activeTab === "jwt" && (
        <div className="space-y-6">
          {/* JWT Input area */}
          <div className="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                Encoded Token
              </label>
              <button
                onClick={() => setJwtToken(SAMPLE_JWT)}
                className="text-xs text-primary hover:underline"
              >
                Load Sample JWT
              </button>
            </div>

            <textarea
              value={jwtToken}
              onChange={(e) => setJwtToken(e.target.value)}
              placeholder="Paste your Bearer token or JWT here (header.payload.signature)..."
              rows={4}
              className="w-full p-3.5 rounded-xl border border-border bg-background text-foreground font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary shadow-inner resize-none break-all"
            />

            {jwtError && (
              <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{jwtError}</span>
              </div>
            )}
          </div>

          {/* Expiration and Status banner */}
          {jwtPayload && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-border bg-card flex items-center gap-3 shadow-xs">
                {tokenStatus.expired ? (
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <span className="text-[11px] text-muted-foreground block">Token Status</span>
                  <span
                    className={`text-sm font-bold ${
                      tokenStatus.expired ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {tokenStatus.expired ? "Expired Token" : "Active / Valid Time"}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-card flex items-center gap-3 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Expires (exp)</span>
                  <span className="text-xs font-semibold text-foreground">
                    {tokenStatus.expiresAt ? tokenStatus.expiresAt.toLocaleString() : "No expiry claim"}
                  </span>
                  {tokenStatus.timeRemaining && (
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      {tokenStatus.timeRemaining}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-card flex items-center gap-3 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Algorithm</span>
                  <span className="text-xs font-mono font-bold text-foreground">
                    {jwtHeader?.alg || "None"} ({jwtHeader?.typ || "JWT"})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Decoded segments grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Header Box */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                Header (Algorithm & Token Type)
              </span>
              <pre className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-foreground font-mono text-xs overflow-x-auto min-h-[140px]">
                <code>{jwtHeader ? JSON.stringify(jwtHeader, null, 2) : "// No valid header"}</code>
              </pre>
            </div>

            {/* Signature Box */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">
                Signature (HMAC / RSA Verification)
              </span>
              <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 space-y-2 min-h-[140px] flex flex-col justify-between">
                <code className="text-xs font-mono text-muted-foreground break-all">
                  {jwtSignature || "// No signature"}
                </code>
                <div className="pt-2 border-t border-blue-500/10 text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Client-side decoder does not perform cryptographic verification.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payload Box (Full width) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                Payload (Claims & Data)
              </span>
              <button
                onClick={copyPayload}
                disabled={!jwtPayload}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-border hover:bg-muted text-foreground transition-colors disabled:opacity-40"
              >
                {copiedPayload ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-foreground font-mono text-xs leading-relaxed overflow-x-auto min-h-[220px]">
              <code>{jwtPayload ? JSON.stringify(jwtPayload, null, 2) : "// No valid payload claims"}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Tab 2: Base64 Converter */}
      {activeTab === "base64" && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-border bg-card flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg border border-border bg-muted p-0.5">
                <button
                  onClick={() => setB64Mode("text")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    b64Mode === "text"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Text Strings
                </button>
                <button
                  onClick={() => setB64Mode("file")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    b64Mode === "file"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  File to Data URL
                </button>
              </div>

              {b64Mode === "text" && (
                <div className="flex rounded-lg border border-border bg-muted p-0.5">
                  <button
                    onClick={() => setB64Direction("decode")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      b64Direction === "decode"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Decode Base64
                  </button>
                  <button
                    onClick={() => setB64Direction("encode")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      b64Direction === "encode"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Encode to Base64
                  </button>
                </div>
              )}
            </div>
          </div>

          {b64Mode === "file" ? (
            <div className="space-y-4">
              <FileDropzone
                onFilesSelected={handleBase64FileAdded}
                maxFiles={1}
                title="Upload any file (image, document, audio) to encode"
                subtitle="Produces standard data:mime;base64,... string for HTML/CSS embedding."
              />

              {b64Output && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-bold text-foreground uppercase">Base64 Data URL</span>
                    <button
                      onClick={copyB64Output}
                      className="flex items-center gap-1 px-3 py-1 rounded-md border border-border hover:bg-muted text-foreground"
                    >
                      {copiedB64 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Data URL</span>
                    </button>
                  </div>
                  <textarea
                    value={b64Output}
                    readOnly
                    rows={8}
                    className="w-full p-4 rounded-2xl border border-border bg-muted/20 text-foreground font-mono text-xs leading-relaxed focus:outline-none shadow-inner resize-none break-all"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Text Input */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {b64Direction === "decode" ? "Base64 Input" : "Plain Text Input"}
                </span>
                <textarea
                  value={b64Input}
                  onChange={(e) => setB64Input(e.target.value)}
                  placeholder="Enter text here..."
                  rows={12}
                  className="w-full p-4 rounded-2xl border border-border bg-card text-foreground font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary shadow-xs resize-none"
                />
              </div>

              {/* Text Output */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-bold text-primary uppercase tracking-wider">
                    {b64Direction === "decode" ? "Decoded Text" : "Base64 Output"}
                  </span>
                  <button
                    onClick={copyB64Output}
                    disabled={!b64Output}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-border hover:bg-muted text-foreground disabled:opacity-40"
                  >
                    {copiedB64 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
                <textarea
                  value={b64Output}
                  readOnly
                  placeholder="Result will appear here..."
                  rows={12}
                  className="w-full p-4 rounded-2xl border border-border bg-muted/20 text-foreground font-mono text-xs leading-relaxed focus:outline-none shadow-inner resize-none select-all"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

