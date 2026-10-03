import { InvoiceGenerator } from "@/components/tools/productivity/InvoiceGenerator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Freelance Rate & Invoice Generator — DAN Tools",
  description: "Form-based layout that calculates taxes/totals and prints client-ready PDF invoices locally.",
};

export default function Page() {
  return <InvoiceGenerator />;
}

