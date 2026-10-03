import { PdfToPowerpoint } from "@/components/tools/pdf/PdfToPowerpoint";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF to POWERPOINT — DAN Tools",
  description: "Convert PDF document pages to PowerPoint .pptx presentation slides locally.",
};

export default function Page() {
  return <PdfToPowerpoint />;
}
