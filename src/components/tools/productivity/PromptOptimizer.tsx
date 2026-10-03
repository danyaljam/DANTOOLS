"use client";

import * as React from "react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { toast } from "sonner";
import {
  Sparkle,
  Copy,
  Check,
  Wand2,
  BookOpen,
  Sliders,
  ShieldCheck,
  FileCode,
  Layers,
} from "lucide-react";

interface PromptConfig {
  role: string;
  context: string;
  tone: string;
  constraints: string[];
  outputFormat: string;
  reasoningSteps: string[];
}

const TEMPLATES = [
  {
    name: "Fullstack Code Reviewer",
    role: "Principal Software Architect specializing in TypeScript, Next.js, and Distributed Systems",
    context: "Reviewing pull requests for security vulnerabilities, race conditions, edge-case bugs, and performance bottlenecks.",
    tone: "Direct, precise, pragmatic, and highly technical without unnecessary praise.",
    constraints: [
      "Never explain obvious syntax changes.",
      "Always suggest concrete, drop-in replacement code snippets.",
      "Flag any potential memory leaks or unhandled promise rejections.",
      "Maintain zero assumptions; verify API boundaries strictly.",
    ],
    outputFormat: "Markdown with GitHub-style alerts and before/after code comparison blocks.",
    reasoningSteps: [
      "Analyze the high-level intent of the PR.",
      "Check for concurrency, security, and null-safety issues.",
      "Evaluate algorithmic complexity and memory efficiency.",
      "Deliver prioritized, actionable feedback starting with blockers.",
    ],
  },
  {
    name: "SQL & Data Engineering Agent",
    role: "Senior Data Warehouse Engineer specialized in Postgres and BigQuery query optimization",
    context: "Translating business analytics questions into performant, indexed SQL queries.",
    tone: "Analytical, methodical, and concise.",
    constraints: [
      "No SELECT *; always specify column projections explicitly.",
      "Include appropriate indexes and partition pruning strategies.",
      "Avoid unnecessary subqueries where CTEs or window functions are clearer.",
    ],
    outputFormat: "Valid SQL block followed by a 2-sentence explanation of query execution plan.",
    reasoningSteps: [
      "Identify the core business metrics required.",
      "Determine filtering predicates and date partitioning.",
      "Structure joins to avoid cartesian explosions.",
    ],
  },
  {
    name: "Technical Copywriter",
    role: "B2B SaaS Developer Marketing & Technical Writer",
    context: "Crafting clear, jargon-free product release documentation and feature announcements.",
    tone: "Engaging, developer-friendly, clear, and action-oriented.",
    constraints: [
      "Eliminate marketing buzzwords like 'revolutionize', 'game-changer', or 'seamless'.",
      "Lead with value and developer pain-points solved.",
      "Keep sentences punchy and under 25 words.",
    ],
    outputFormat: "AIDA structure (Attention, Interest, Desire, Action) formatted in clean Markdown.",
    reasoningSteps: [
      "Identify target developer persona.",
      "Translate features into tangible workflow speed improvements.",
      "Draft concise headline and compelling call-to-action.",
    ],
  },
];

export function PromptOptimizer() {
  const [config, setConfig] = React.useState<PromptConfig>(TEMPLATES[0]);
  const [userDraft, setUserDraft] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  // Generate XML-delimited structured system prompt
  const generatedPrompt = React.useMemo(() => {
    return `<system_prompt>
<role>
You are a ${config.role}.
</role>

<context>
${config.context}
</context>

<tone_and_style>
${config.tone}
</tone_and_style>

<rules_and_constraints>
${config.constraints.map((c) => `- ${c}`).join("\n")}
</rules_and_constraints>

<chain_of_thought_instructions>
When processing user queries, follow this systematic evaluation process:
${config.reasoningSteps.map((step, idx) => `${idx + 1}. ${step}`).join("\n")}
</chain_of_thought_instructions>

<output_format>
${config.outputFormat}
</output_format>
</system_prompt>`;
  }, [config]);

  const copyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    toast.success("System prompt copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // One-click optimize raw user draft
  const enhanceUserDraft = () => {
    if (!userDraft.trim()) {
      toast.warning("Please type a rough prompt draft to enhance.");
      return;
    }

    setConfig({
      role: `Specialized domain expert instructed to execute: "${userDraft.trim()}"`,
      context: `The user requires high-fidelity, production-grade output for: "${userDraft.trim()}".`,
      tone: "Authoritative, concise, insightful, and strictly adhering to modern standards.",
      constraints: [
        "Do not apologize or provide boilerplate introductory filler.",
        "Provide direct, complete answers without omitting critical details.",
        "Highlight potential trade-offs and alternative solutions.",
        "Strictly adhere to requested output schemas.",
      ],
      outputFormat: "Structured markdown with logical headers and actionable bullet points.",
      reasoningSteps: [
        "Deconstruct the user's primary goal and underlying constraints.",
        "Evaluate standard industry best practices relevant to this domain.",
        "Formulate a complete, modular solution.",
      ],
    });

    toast.success("Enhanced draft into an enterprise structured system prompt!");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="Productivity & Text"
        title="AI System Prompt Optimizer"
        description="Convert rough instructions into structured, XML-delimited LLM system prompts with negative constraints and chain-of-thought rules."
        onReset={() => setConfig(TEMPLATES[0])}
      />

      {/* Preset bar */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          <span>Starter Personas</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.name}
              onClick={() => setConfig(tmpl)}
              className="px-3 py-1.5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted text-xs font-medium text-foreground transition-all shadow-xs"
            >
              <span>{tmpl.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Form & Draft Enhancer */}
        <div className="lg:col-span-6 space-y-6">
          {/* Quick Draft Enhancer */}
          <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Wand2 className="w-4 h-4" /> Quick Draft Auto-Optimizer
              </span>
            </div>

            <textarea
              value={userDraft}
              onChange={(e) => setUserDraft(e.target.value)}
              placeholder="Paste a rough prompt (e.g. 'Help me write a Python scraper' or 'Review my landing page')..."
              rows={3}
              className="w-full p-3 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary resize-none"
            />

            <button
              onClick={enhanceUserDraft}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/90 transition-all"
            >
              <Sparkle className="w-3.5 h-3.5" />
              <span>Transform Into Structured Prompt</span>
            </button>
          </div>

          {/* Prompt Architecture Form */}
          <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-foreground">System Prompt Blueprint</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Agent Persona & Role Definition
                </label>
                <input
                  type="text"
                  value={config.role}
                  onChange={(e) => setConfig({ ...config, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Context & Operational Scope
                </label>
                <textarea
                  value={config.context}
                  onChange={(e) => setConfig({ ...config, context: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Tone & Communication Style
                </label>
                <input
                  type="text"
                  value={config.tone}
                  onChange={(e) => setConfig({ ...config, tone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Output Format & Structure
                </label>
                <input
                  type="text"
                  value={config.outputFormat}
                  onChange={(e) => setConfig({ ...config, outputFormat: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Generated System Prompt Display */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Optimized System Prompt (XML Format)
            </span>

            <button
              onClick={copyPrompt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/90 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy System Prompt</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-5 rounded-2xl border border-border bg-card text-foreground font-mono text-xs leading-relaxed overflow-x-auto min-h-[520px] shadow-xs select-all whitespace-pre-wrap">
            <code>{generatedPrompt}</code>
          </pre>
          <p className="text-[11px] text-muted-foreground">
            Formatted using best practices for Claude 3.5, GPT-4o, and Gemini 1.5/2.0 with XML tags for strict prompt adherence.
          </p>
        </div>
      </div>
    </div>
  );
}

