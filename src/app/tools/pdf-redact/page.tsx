import { PdfRedact } from "@/components/tools/pdf/PdfRedact";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Redact PDF — DAN Tools",
  description: "Permanently black out and remove sensitive text, numbers, or private areas from PDF documents.",
};

export default function Page() {
  return <PdfRedact />;
}
