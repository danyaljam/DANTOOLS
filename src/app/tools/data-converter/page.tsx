import { DataConverter } from "@/components/tools/developer/DataConverter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JSON / CSV / YAML Converter — DAN Tools",
  description: "Bidirectional conversion between JSON, CSV, and YAML with formatting and error validation completely in browser.",
};

export default function Page() {
  return <DataConverter />;
}

