import { PdfToMarkdown } from "@/components/tools/pdf/PdfToMarkdown";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "PDF to Markdown — DAN Tools", description: "Extract selectable PDF text as a Markdown document." };

export default function Page() { return <PdfToMarkdown />; }