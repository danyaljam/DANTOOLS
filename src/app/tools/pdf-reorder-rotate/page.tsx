import { PdfReorderRotate } from "@/components/tools/pdf/PdfReorderRotate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF Page Reorder & Rotate — DAN Tools",
  description: "Visually resequence PDF pages and rotate individual pages (90°/180°) completely client-side.",
};

export default function Page() {
  return <PdfReorderRotate />;
}

