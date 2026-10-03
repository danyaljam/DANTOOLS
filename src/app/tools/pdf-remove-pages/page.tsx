import { PdfRemovePages } from "@/components/tools/pdf/PdfRemovePages";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Remove PDF Pages — DAN Tools",
  description: "Select and delete unwanted pages from your PDF document client-side.",
};

export default function Page() {
  return <PdfRemovePages />;
}
