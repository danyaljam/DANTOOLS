import { PowerpointToPdf } from "@/components/tools/pdf/PowerpointToPdf";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "POWERPOINT to PDF — DAN Tools",
  description: "Convert PowerPoint .pptx presentations to PDF slides locally in your browser.",
};

export default function Page() {
  return <PowerpointToPdf />;
}
