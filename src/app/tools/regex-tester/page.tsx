import { RegexTester } from "@/components/tools/developer/RegexTester";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regex Visualizer & Tester — DAN Tools",
  description: "Live regex evaluation with capture group breakdown and quick snippet cheat-sheet.",
};

export default function Page() {
  return <RegexTester />;
}

