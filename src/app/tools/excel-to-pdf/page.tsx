import { ExcelToPdf } from "@/components/tools/pdf/ExcelToPdf";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EXCEL to PDF — DAN Tools",
  description: "Convert Excel (.xlsx) and CSV tables into formatted PDF files locally.",
};

export default function Page() {
  return <ExcelToPdf />;
}
