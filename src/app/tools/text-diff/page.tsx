import { TextDiff } from "@/components/tools/developer/TextDiff";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Text Diff Checker — DAN Tools", description: "Compare text and code blocks locally with line-level changes." };
export default function Page() { return <TextDiff />; }
