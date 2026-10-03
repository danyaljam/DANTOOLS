import { PromptOptimizer } from "@/components/tools/productivity/PromptOptimizer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI System Prompt Optimizer — DAN Tools",
  description: "Refine loose user prompts into structured, battle-tested LLM system prompts with negative constraints.",
};

export default function Page() {
  return <PromptOptimizer />;
}

