import { PdfEditor } from "@/components/tools/pdf/PdfEditor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF Editor — DAN Tools",
  description: "Add text, highlights, and freehand annotations to PDF files locally in your browser.",
};

export default function Page() {
  return <PdfEditor />;
}
