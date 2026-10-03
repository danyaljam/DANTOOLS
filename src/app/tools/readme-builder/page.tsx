import { ReadmeBuilder } from "@/components/tools/productivity/ReadmeBuilder";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Markdown & README Builder — DAN Tools",
  description: "Interactive form editor to generate production-ready GitHub README.md files with live preview.",
};

export default function Page() {
  return <ReadmeBuilder />;
}

