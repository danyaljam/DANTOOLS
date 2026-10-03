import { PdfOcr } from "@/components/tools/pdf/PdfOcr";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OCR PDF — DAN Tools",
  description: "Extract text from scanned PDF pages and documents locally.",
};

export default function Page() {
  return <PdfOcr />;
}
