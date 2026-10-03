import { PdfScan } from "@/components/tools/pdf/PdfScan";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan to PDF — DAN Tools",
  description: "Capture documents using your camera with contrast filters and export to PDF locally.",
};

export default function Page() {
  return <PdfScan />;
}
