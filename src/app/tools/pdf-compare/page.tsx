import { PdfCompare } from "@/components/tools/pdf/PdfCompare";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Compare PDFs — DAN Tools", description: "Compare selectable text in two PDF files page by page." };

export default function Page() { return <PdfCompare />; }