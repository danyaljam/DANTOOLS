import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TOOLS } from "@/lib/tools-registry";
import { UtilityWorkspace } from "@/components/tools/shared/UtilityWorkspace";
import { DocumentEditor } from "@/components/tools/writing/DocumentEditor";

const UTILITY_CATEGORIES = new Set(["developer", "office", "productivity", "writing", "web"]);
const EXPLICIT_TOOL_IDS = new Set([
  "cron-explainer", "data-converter", "exif-stripper", "favicon-generator", "image-blur",
  "image-compressor", "image-pdf-converter", "invoice-generator", "jwt-base64", "og-previewer",
  "pdf-compressor", "pdf-editor", "pdf-merge-split", "pdf-reorder-rotate", "pdf-watermark",
  "prompt-optimizer", "readme-builder", "regex-tester", "social-resizer", "color-converter",
  "password-generator", "text-diff", "timestamp-converter",
  "pdf-crop", "pdf-forms", "pdf-compare", "pdf-to-markdown",
  "pdf-remove-pages", "pdf-scan", "pdf-repair", "pdf-ocr",
  "word-to-pdf", "pdf-to-word", "powerpoint-to-pdf", "pdf-to-powerpoint",
  "excel-to-pdf", "pdf-to-excel", "html-to-pdf", "pdf-to-pdfa",
  "pdf-unlock", "pdf-protect", "pdf-sign", "pdf-redact",
  "pdf-summarizer", "pdf-translate",
]);
const UTILITY_TOOLS = TOOLS.filter((tool) => UTILITY_CATEGORIES.has(tool.category) && !EXPLICIT_TOOL_IDS.has(tool.id));

export function generateStaticParams() {
  return UTILITY_TOOLS.map((tool) => ({ utility: tool.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ utility: string }>;
}): Promise<Metadata> {
  const { utility } = await params;
  const tool = UTILITY_TOOLS.find((item) => item.id === utility);
  return tool ? { title: `${tool.title} — DAN Tools`, description: tool.description } : {};
}

export default async function UtilityPage({
  params,
}: {
  params: Promise<{ utility: string }>;
}) {
  const { utility } = await params;
  const tool = UTILITY_TOOLS.find((item) => item.id === utility);
  if (!tool) notFound();
  if (tool.id === "document-editor") return <DocumentEditor />;
  return <UtilityWorkspace tool={tool} />;
}
