import { PdfSign } from "@/components/tools/pdf/PdfSign";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign PDF — DAN Tools",
  description: "Create your signature and stamp it onto PDF document pages locally.",
};

export default function Page() {
  return <PdfSign />;
}
