import { PdfCrop } from "@/components/tools/pdf/PdfCrop";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Crop PDF Pages — DAN Tools", description: "Crop selected PDF pages by custom margins in your browser." };

export default function Page() { return <PdfCrop />; }