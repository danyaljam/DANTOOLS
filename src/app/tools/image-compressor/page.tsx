import { ImageCompressor } from "@/components/tools/image/ImageCompressor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Compressor & Converter — DAN Tools",
  description: "Shrink PNG, JPG, and WebP files locally with real-time before/after quality comparison.",
};

export default function Page() {
  return <ImageCompressor />;
}

