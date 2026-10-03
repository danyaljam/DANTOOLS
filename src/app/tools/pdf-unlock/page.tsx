import { PdfUnlock } from "@/components/tools/pdf/PdfUnlock";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unlock PDF — DAN Tools",
  description: "Remove passwords and printing restrictions from your PDF document client-side.",
};

export default function Page() {
  return <PdfUnlock />;
}
