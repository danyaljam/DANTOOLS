"use client";

import * as React from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { downloadBlob, formatBytes } from "@/lib/utils";

interface FormFieldInfo {
  name: string;
  type: string;
  value: string | boolean;
  options: string[];
}

export function PdfForms() {
  const [file, setFile] = React.useState<File | null>(null);
  const [fields, setFields] = React.useState<FormFieldInfo[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  const loadFile = async (files: File[]) => {
    const selected = files[0];
    if (!selected) return;
    try {
      const document = await PDFDocument.load(await selected.arrayBuffer());
      const form = document.getForm();
      const loaded = form.getFields().map((field) => {
        const type = field.constructor.name;
        let value: string | boolean = "";
        let options: string[] = [];
        if (type === "PDFTextField") value = (field as any).getText() || "";
        if (type === "PDFCheckBox") value = (field as any).isChecked();
        if (type === "PDFDropdown" || type === "PDFRadioGroup" || type === "PDFOptionList") {
          value = (field as any).getSelected()?.[0] || "";
          options = (field as any).getOptions();
        }
        return { name: field.getName(), type, value, options };
      });
      if (!loaded.length) {
        toast.info("This PDF does not contain fillable AcroForm fields.");
      }
      setFile(selected);
      setFields(loaded);
    } catch (error) {
      toast.error(`Could not read PDF form: ${(error as Error).message}`);
    }
  };

  const updateValue = (name: string, value: string | boolean) => {
    setFields((current) => current.map((field) => field.name === name ? { ...field, value } : field));
  };

  const save = async () => {
    if (!file) return;
    setIsSaving(true);
    try {
      const document = await PDFDocument.load(await file.arrayBuffer());
      const form = document.getForm();
      fields.forEach((field) => {
        const target = form.getField(field.name) as any;
        if (field.type === "PDFTextField") target.setText(String(field.value));
        else if (field.type === "PDFCheckBox") field.value ? target.check() : target.uncheck();
        else if (field.type === "PDFDropdown" || field.type === "PDFRadioGroup") {
          if (field.value) target.select(String(field.value));
        } else if (field.type === "PDFOptionList") {
          if (field.value) target.select(String(field.value));
        }
      });
      const bytes = await document.save();
      downloadBlob(new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }), `filled_${file.name}`);
      toast.success("Filled PDF downloaded.");
    } catch (error) {
      toast.error(`Could not save form: ${(error as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => { setFile(null); setFields([]); };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <ToolHeader category="PDF Utilities" title="PDF Forms" description="Fill standard interactive PDF form fields and save a new copy locally." onReset={reset} />
      {!file ? (
        <FileDropzone onFilesSelected={loadFile} accept={{ "application/pdf": [".pdf"] }} maxFiles={1} title="Choose a fillable PDF" subtitle="Supports standard AcroForm text, checkbox, dropdown, and radio fields." />
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-4 text-sm"><span className="font-semibold">{file.name}</span><span className="text-muted-foreground"> · {formatBytes(file.size)} · {fields.length} field(s)</span></div>
          {fields.length === 0 ? <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No standard fillable fields were found in this PDF.</div> : (
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <label key={field.name} className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">{field.name}</span>
                  {field.type === "PDFCheckBox" ? (
                    <input type="checkbox" checked={Boolean(field.value)} onChange={(event) => updateValue(field.name, event.target.checked)} className="h-4 w-4 accent-primary" />
                  ) : field.options.length ? (
                    <select value={String(field.value)} onChange={(event) => updateValue(field.name, event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="">Select an option</option>{field.options.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                  ) : field.type === "PDFTextField" ? (
                    <input value={String(field.value)} onChange={(event) => updateValue(field.name, event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                  ) : (
                    <span className="block text-xs text-muted-foreground">Unsupported field type: {field.type}</span>
                  )}
                </label>
              ))}
            </div>
          )}
          <button onClick={save} disabled={!fields.length || isSaving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><FileText className="h-4 w-4" /><Download className="h-4 w-4" /></>}
            Save filled PDF
          </button>
        </div>
      )}
    </div>
  );
}