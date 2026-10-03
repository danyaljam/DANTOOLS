import { CronExplainer } from "@/components/tools/developer/CronExplainer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cron Schedule Explainer — DAN Tools",
  description: "Translate 5-part cron expressions into plain English with a schedule of upcoming run dates.",
};

export default function Page() {
  return <CronExplainer />;
}

