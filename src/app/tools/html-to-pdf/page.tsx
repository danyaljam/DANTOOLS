import { HtmlToPdf } from "@/components/tools/pdf/HtmlToPdf";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HTML to PDF — DAN Tools",
  description: "Convert HTML code and styled web templates into PDF documents client-side.",
};

export default function Page() {
  return <HtmlToPdf />;
}
