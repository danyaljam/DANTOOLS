import { PdfSummarizer } from "@/components/tools/pdf/PdfSummarizer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI PDF Summarizer — DAN Tools",
  description: "Generate executive summaries, key bullet points, and action items locally without uploading files.",
};

export default function Page() {
  return <PdfSummarizer />;
}
