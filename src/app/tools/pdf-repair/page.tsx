import { PdfRepair } from "@/components/tools/pdf/PdfRepair";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Repair PDF — DAN Tools",
  description: "Recover corrupted, damaged, or unreadable PDF files client-side.",
};

export default function Page() {
  return <PdfRepair />;
}
