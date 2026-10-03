import { PdfCompressor } from "@/components/tools/pdf/PdfCompressor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF Compressor — DAN Tools",
  description: "Reduce PDF file size with selectable quality presets directly in your browser.",
};

export default function Page() {
  return <PdfCompressor />;
}
