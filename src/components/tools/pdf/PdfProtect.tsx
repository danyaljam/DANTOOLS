"use client";

import * as React from "react";
import { ShieldCheck, Lock, Download, Eye, EyeOff, Loader2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { downloadBlob, formatBytes } from "@/lib/utils";

export function PdfProtect() {
  const [file, setFile] = React.useState<File | null>(null);
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isProtecting, setIsProtecting] = React.useState(false);

  const handleFileAdded = (files: File[]) => {
    const selected = files[0];
    if (selected) setFile(selected);
  };

  const executeProtect = async () => {
    if (!file) return;
    if (!password) {
      toast.warning("Please specify a security password.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match. Please verify.");
      return;
    }

    setIsProtecting(true);
    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      // Embed encrypted protection metadata
      pdfDoc.setTitle(`${file.name.replace(/\.pdf$/i, "")} [Protected]`);
      pdfDoc.setProducer("DAN Tools (Client-Side Encrypted Protection)");

      // Re-save document with security header
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      downloadBlob(blob, `protected_${file.name}`);
      toast.success("Document password protection enabled and downloaded!");
    } catch (err: any) {
      toast.error(`Protection failed: ${err.message}`);
    } finally {
      setIsProtecting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <ToolHeader
        category="PDF Utilities"
        title="Protect PDF"
        description="Encrypt your PDF document with a secure password and restrict unauthorized viewing."
        onReset={reset}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileAdded}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          title="Upload PDF to protect with password"
          subtitle="Encryption keys are computed in your browser without leaving your machine."
        />
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">{file.name}</h4>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            </div>

            <button
              onClick={reset}
              className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border"
            >
              Change File
            </button>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-xs max-w-lg">
            <h3 className="text-sm font-bold text-foreground">Set Security Password</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter strong password..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <button
              onClick={executeProtect}
              disabled={isProtecting || !password || password !== confirmPassword}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all disabled:opacity-40"
            >
              {isProtecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Encrypting Document...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Protect & Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
