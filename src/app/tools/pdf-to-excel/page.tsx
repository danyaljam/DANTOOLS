import { PdfToExcel } from "@/components/tools/pdf/PdfToExcel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF to EXCEL — DAN Tools",
  description: "Extract tabular numbers and data from PDF pages into Excel spreadsheets and CSV.",
};

export default function Page() {
  return <PdfToExcel />;
}
