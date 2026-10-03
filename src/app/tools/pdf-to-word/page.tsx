import { PdfToWord } from "@/components/tools/pdf/PdfToWord";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF to WORD — DAN Tools",
  description: "Convert PDF documents to editable Microsoft Word (.docx) files locally.",
};

export default function Page() {
  return <PdfToWord />;
}
