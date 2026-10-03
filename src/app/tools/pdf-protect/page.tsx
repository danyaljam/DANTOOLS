import { PdfProtect } from "@/components/tools/pdf/PdfProtect";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Protect PDF — DAN Tools",
  description: "Encrypt and password-protect sensitive PDF documents locally.",
};

export default function Page() {
  return <PdfProtect />;
}
