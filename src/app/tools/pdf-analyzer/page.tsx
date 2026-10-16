import { PdfAnalyzer } from "@/components/tools/pdf/PdfAnalyzer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI PDF Analyzer & Study Assistant — DAN Tools",
  description: "Instant runtime PDF summarization, interactive flashcards, self-grading quizzes, and ephemeral zero-retention chatbot running 100% locally in your browser.",
};

export default function Page() {
  return <PdfAnalyzer />;
}
