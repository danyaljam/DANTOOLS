import { PdfWatermark } from "@/components/tools/pdf/PdfWatermark";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF Watermark & Page Numbers — DAN Tools",
  description: "Overlay custom text watermarks, opacity sliders, and 'Page X of Y' numbers completely offline in your browser.",
};

export default function Page() {
  return <PdfWatermark />;
}

