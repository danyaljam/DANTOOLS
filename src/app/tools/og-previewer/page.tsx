import { OgPreviewer } from "@/components/tools/productivity/OgPreviewer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meta Tags & OpenGraph Previewer — DAN Tools",
  description: "Preview social cards across Twitter/X, Facebook, LinkedIn, and Google Search with copyable meta tags.",
};

export default function Page() {
  return <OgPreviewer />;
}

