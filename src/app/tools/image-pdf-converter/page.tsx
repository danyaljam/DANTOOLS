import { ImagePdfConverter } from "@/components/tools/pdf/ImagePdfConverter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image ↔ PDF Converter — DAN Tools",
  description: "Convert JPG/PNG images to a single PDF, or extract PDF pages into high-res images client-side.",
};

export default function Page() {
  return <ImagePdfConverter />;
}

