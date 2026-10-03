import { ExifStripper } from "@/components/tools/image/ExifStripper";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EXIF Metadata Stripper — DAN Tools",
  description: "Inspect GPS coordinates and camera hardware tags, then strip all metadata client-side.",
};

export default function Page() {
  return <ExifStripper />;
}

