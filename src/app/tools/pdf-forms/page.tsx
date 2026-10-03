import { PdfForms } from "@/components/tools/pdf/PdfForms";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "PDF Forms — DAN Tools", description: "Fill and save interactive PDF form fields in your browser." };

export default function Page() { return <PdfForms />; }