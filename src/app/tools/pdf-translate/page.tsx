import { PdfTranslate } from "@/components/tools/pdf/PdfTranslate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Extract PDF Text — DAN Tools",
  description: "Extract, edit, and export PDF text locally without uploading your document.",
};

export default function Page() {
  return <PdfTranslate />;
}
