import { PdfOcr } from "@/components/tools/pdf/PdfOcr";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OCR Studio — DAN Tools",
  description: "Recognize scanned PDFs and images locally, with offline English OCR and no page quota.",
};

export default function Page() {
  return <PdfOcr />;
}
