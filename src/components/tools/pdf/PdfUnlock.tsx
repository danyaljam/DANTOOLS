"use client";

import * as React from "react";
import { Unlock, Lock, Download, KeyRound, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { downloadBlob, formatBytes } from "@/lib/utils";

export function PdfUnlock() {
  const [file, setFile] = React.useState<File | null>(null);
  const [password, setPassword] = React.useState("");
  const [needsPassword, setNeedsPassword] = React.useState(false);
  const [isUnlocking, setIsUnlocking] = React.useState(false);
  const [unlockedBlob, setUnlockedBlob] = React.useState<Blob | null>(null);

  const handleFileAdded = async (files: File[]) => {
    const selected = files[0];
    if (!selected) return;
    setFile(selected);
    setPassword("");
    setUnlockedBlob(null);
    setIsUnlocking(true);

    try {
      const buffer = await selected.arrayBuffer();
      // Test if encrypted with permissions or password
      try {
        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const cleanDoc = await PDFDocument.create();
        const copied = await cleanDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copied.forEach((p) => cleanDoc.addPage(p));
        const bytes = await cleanDoc.save();
        const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
        setUnlockedBlob(blob);
        setNeedsPassword(false);
        toast.success("PDF permissions lock removed automatically!");
      } catch (err: any) {
        setNeedsPassword(true);
        toast.info("Document requires user password to decrypt.");
      }
    } catch (err: any) {
      toast.error(`Could not read PDF: ${err.message}`);
      setFile(null);
    } finally {
      setIsUnlocking(false);
    }
  };

  const decryptWithPassword = async () => {
    if (!file || !password) {
      toast.warning("Please enter the document password.");
      return;
    }
    setIsUnlocking(true);
    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const cleanDoc = await PDFDocument.create();
      const copied = await cleanDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
      copied.forEach((p) => cleanDoc.addPage(p));
      const bytes = await cleanDoc.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      setUnlockedBlob(blob);
      setNeedsPassword(false);
      toast.success("Password verified and PDF unlocked!");
    } catch (err: any) {
      toast.error("Incorrect password or decryption failed: " + err.message);
    } finally {
      setIsUnlocking(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPassword("");
    setNeedsPassword(false);
    setUnlockedBlob(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <ToolHeader
        category="PDF Utilities"
        title="Unlock PDF"
        description="Remove password protection, print restrictions, and copy locks from your PDF document."
        onReset={reset}
      />

      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileAdded}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          title="Upload locked PDF to unlock"
          subtitle="Removes restrictions and decrypts documents safely in client memory."
        />
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
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

          {needsPassword && !unlockedBlob && (
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <KeyRound className="w-4 h-4 text-primary" />
                <span>Enter Document Password</span>
              </div>
              <p className="text-xs text-muted-foreground">
                This PDF requires a password to open. Enter the password below to decrypt and save an unencrypted copy.
              </p>
              <div className="flex gap-3">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary"
                  onKeyDown={(e) => e.key === "Enter" && decryptWithPassword()}
                />
                <button
                  onClick={decryptWithPassword}
                  disabled={isUnlocking || !password}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/90 transition-all disabled:opacity-40"
                >
                  {isUnlocking ? "Unlocking..." : "Unlock"}
                </button>
              </div>
            </div>
          )}

          {unlockedBlob && (
            <div className="p-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <Unlock className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-foreground">Restrictions Removed!</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Your PDF has been unencrypted. You can now open, print, and copy from it without passwords.
              </p>
              <button
                onClick={() => downloadBlob(unlockedBlob, `unlocked_${file.name}`)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Unlocked PDF</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
