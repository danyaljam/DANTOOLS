import { PdfMergeSplit } from "@/components/tools/pdf/PdfMergeSplit";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF Merger & Splitter — DAN Tools",
  description: "Combine multiple PDF files or extract selective page ranges with interactive thumbnail preview.",
};

export default function Page() {
  return <PdfMergeSplit />;
}

