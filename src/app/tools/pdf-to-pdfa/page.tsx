import { PdfToPdfA } from "@/components/tools/pdf/PdfToPdfA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF to PDF/A — DAN Tools",
  description: "Convert documents to ISO 19005 compliant PDF/A for long-term archiving locally.",
};

export default function Page() {
  return <PdfToPdfA />;
}
