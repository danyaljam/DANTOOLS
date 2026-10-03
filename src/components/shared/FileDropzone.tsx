"use client";

import * as React from "react";
import { useDropzone, Accept } from "react-dropzone";
import { UploadCloud, File, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: Accept;
  maxFiles?: number;
  maxSizeMB?: number;
  title?: string;
  subtitle?: string;
  className?: string;
  disabled?: boolean;
}

export function FileDropzone({
  onFilesSelected,
  accept,
  maxFiles = 10,
  maxSizeMB = 100,
  title = "Drop your files here, or browse",
  subtitle = "Everything is processed strictly inside your browser",
  className,
  disabled = false,
}: FileDropzoneProps) {
  const [error, setError] = React.useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: (acceptedFiles, rejectedFiles) => {
      setError(null);
      if (rejectedFiles && rejectedFiles.length > 0) {
        const firstError = rejectedFiles[0].errors[0];
        setError(firstError?.message || "Invalid file selection");
        return;
      }
      if (acceptedFiles && acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles);
      }
    },
    accept,
    maxFiles,
    maxSize: maxSizeMB * 1024 * 1024,
    disabled,
  });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all text-center group",
          isDragActive
            ? "border-primary bg-primary/10 scale-[0.99]"
            : "border-border/80 bg-card hover:border-primary/50 hover:bg-muted/30",
          isDragReject && "border-destructive bg-destructive/10",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <input {...getInputProps()} />

        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">{subtitle}</p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <span className="px-2 py-0.5 rounded bg-muted border border-border">
            Max {maxSizeMB}MB
          </span>
          <span className="px-2 py-0.5 rounded bg-muted border border-border">
            {maxFiles > 1 ? `Up to ${maxFiles} files` : "Single file"}
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
            Local Only
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

