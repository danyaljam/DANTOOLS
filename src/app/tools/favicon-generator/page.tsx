import { FaviconGenerator } from "@/components/tools/image/FaviconGenerator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favicon & App Icon Generator — DAN Tools",
  description: "Convert 1 image into a complete .ico and multi-size PNG ZIP bundle for web, iOS, and Android.",
};

export default function Page() {
  return <FaviconGenerator />;
}

