import { WordToPdf } from "@/components/tools/pdf/WordToPdf";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WORD to PDF — DAN Tools",
  description: "Convert Word .docx files to PDF locally without third-party servers.",
};

export default function Page() {
  return <WordToPdf />;
}
