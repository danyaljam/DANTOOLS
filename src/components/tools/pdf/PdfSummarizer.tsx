"use client";

import * as React from "react";
import {
  FileText,
  Sparkles,
  Download,
  Copy,
  Clock,
  BookOpen,
  BarChart2,
  Check,
  Loader2,
  Sliders,
  Shield,
  Key
} from "lucide-react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { getPdfJs } from "@/lib/pdf-helpers";
import { downloadBlob, formatBytes } from "@/lib/utils";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

interface PageText {
  pageNumber: number;
  text: string;
}

export function PdfSummarizer() {
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [pages, setPages] = React.useState<PageText[]>([]);
  const [summaryLength, setSummaryLength] = React.useState<"short" | "medium" | "detailed">("medium");
  const [apiKey, setApiKey] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [stats, setStats] = React.useState({
    words: 0,
    sentences: 0,
    readingTimeMinutes: 0,
    topKeywords: [] as { word: string; count: number }[],
  });

  const [summary, setSummary] = React.useState<{
    executiveSummary: string;
    keyPoints: string[];
    actionItems: string[];
  }>({
    executiveSummary: "",
    keyPoints: [],
    actionItems: [],
  });

  // Client-side NLP Extractive Summarizer
  const generateClientSummary = (allText: string, length: "short" | "medium" | "detailed") => {
    // 1. Clean and tokenize into sentences
    const cleanText = allText.replace(/\s+/g, " ").trim();
    if (!cleanText) {
      return { executiveSummary: "No text could be extracted from this PDF.", keyPoints: [], actionItems: [] };
    }

    const sentences = cleanText
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && !s.startsWith("http"));

    const words = cleanText
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);

    // Stop words list
    const stopWords = new Set([
      "about", "above", "after", "again", "against", "all", "and", "any", "are", "because",
      "been", "before", "being", "below", "between", "both", "but", "by", "could", "did",
      "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further",
      "had", "has", "have", "having", "here", "how", "into", "itself", "just", "more",
      "most", "other", "our", "ours", "ourselves", "out", "over", "own", "same", "should",
      "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then",
      "there", "these", "they", "this", "those", "through", "too", "under", "until", "very",
      "was", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "will",
      "with", "would", "your", "yours", "yourself", "yourselves"
    ]);

    const wordFreq: Record<string, number> = {};
    for (const w of words) {
      if (!stopWords.has(w)) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      }
    }

    // Top keywords
    const topKeywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    // Score sentences based on word frequencies and position
    const sentenceScores = sentences.map((sentence, idx) => {
      const sentenceWords = sentence
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/);
      let score = 0;
      for (const w of sentenceWords) {
        if (wordFreq[w]) score += wordFreq[w];
      }
      // Boost earlier sentences (lead bias)
      const positionBoost = 1 + 1 / (idx + 1);
      return {
        sentence,
        score: (score / Math.max(1, sentenceWords.length)) * positionBoost,
        index: idx,
      };
    });

    const targetCounts = {
      short: { exec: 2, points: 3, actions: 2 },
      medium: { exec: 4, points: 5, actions: 3 },
      detailed: { exec: 7, points: 8, actions: 5 },
    }[length];

    // Pick top sentences for executive summary
    const topSentences = [...sentenceScores]
      .sort((a, b) => b.score - a.score)
      .slice(0, targetCounts.exec)
      .sort((a, b) => a.index - b.index)
      .map((s) => s.sentence);

    // Pick top bullet points
    const remainingSentences = sentenceScores.filter(
      (s) => !topSentences.includes(s.sentence)
    );
    const keyBullets = [...remainingSentences]
      .sort((a, b) => b.score - a.score)
      .slice(0, targetCounts.points)
      .map((s) => s.sentence);

    // Pick action items / conclusion statements
    const actionSentences = sentences.filter((s) =>
      /\b(must|should|recommend|required|will|ensure|objective|goal|action|implement|step)\b/i.test(s)
    );
    const actions = (actionSentences.length > 0 ? actionSentences : sentences)
      .slice(0, targetCounts.actions)
      .map((s) => s.replace(/^[0-9.-]+\s*/, ""));

    return {
      executiveSummary: topSentences.join(" "),
      keyPoints: keyBullets,
      actionItems: actions,
      stats: {
        words: words.length,
        sentences: sentences.length,
        readingTimeMinutes: Math.ceil(words.length / 200),
        topKeywords,
      },
    };
  };

  const processPdf = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    try {
      const pdfjs = await getPdfJs();
      const arrayBuffer = await selectedFile.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;

      const extractedPages: PageText[] = [];
      let fullText = "";

      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const pageStr = textContent.items
          .map((item: any) => item.str || "")
          .join(" ");
        extractedPages.push({ pageNumber: i, text: pageStr });
        fullText += " " + pageStr;
      }

      setPages(extractedPages);

      const result = generateClientSummary(fullText, summaryLength);
      setSummary({
        executiveSummary: result.executiveSummary,
        keyPoints: result.keyPoints,
        actionItems: result.actionItems,
      });
      if (result.stats) {
        setStats(result.stats);
      }

      toast.success(`Successfully analyzed ${doc.numPages} page(s) locally`);
    } catch (err: any) {
      toast.error(`Error processing PDF: ${err.message}`);
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLengthChange = (newLength: "short" | "medium" | "detailed") => {
    setSummaryLength(newLength);
    if (pages.length > 0) {
      const fullText = pages.map((p) => p.text).join(" ");
      const result = generateClientSummary(fullText, newLength);
      setSummary({
        executiveSummary: result.executiveSummary,
        keyPoints: result.keyPoints,
        actionItems: result.actionItems,
      });
    }
  };

  const handleCopy = () => {
    const textToCopy = `=== EXECUTIVE SUMMARY ===\n${summary.executiveSummary}\n\n=== KEY POINTS ===\n${summary.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\n=== KEY TAKEAWAYS & ACTIONS ===\n${summary.actionItems.map((a, i) => `• ${a}`).join("\n")}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Summary copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const mdContent = `# AI Document Summary: ${file?.name || "Document"}\n\n> Generated client-side with 100% privacy on DAP Tools.\n\n## 📊 Document Stats\n- **Total Words:** ${stats.words}\n- **Estimated Reading Time:** ${stats.readingTimeMinutes} min\n- **Top Themes:** ${stats.topKeywords.map((k) => `${k.word} (${k.count})`).join(", ")}\n\n## 📝 Executive Summary\n${summary.executiveSummary}\n\n## 💡 Key Highlights\n${summary.keyPoints.map((p) => `- ${p}`).join("\n")}\n\n## 🎯 Action Items & Focus Points\n${summary.actionItems.map((a) => `- ${a}`).join("\n")}\n`;
    downloadBlob(
      new Blob([mdContent], { type: "text/markdown" }),
      `${file?.name.replace(/\.pdf$/i, "")}-summary.md`
    );
    toast.success("Downloaded summary markdown");
  };

  const handleDownloadPdf = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      let y = 800;
      page.drawText("Document Summary Report", { x: 50, y, size: 20, font: fontBold, color: rgb(0.1, 0.1, 0.2) });
      y -= 25;
      page.drawText(`File: ${file?.name || "Document"} | Analyzed with 100% Client-Side Privacy`, { x: 50, y, size: 10, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
      y -= 35;

      page.drawText("EXECUTIVE SUMMARY", { x: 50, y, size: 12, font: fontBold, color: rgb(0.2, 0.4, 0.8) });
      y -= 20;

      // Word wrapping helper
      const drawWrappedText = (text: string, fontSize: number, font: any, maxWidth: number) => {
        const words = text.split(" ");
        let line = "";
        for (const w of words) {
          const testLine = line + (line ? " " : "") + w;
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);
          if (textWidth > maxWidth && line) {
            if (y < 60) return; // simple limit
            page.drawText(line, { x: 50, y, size: fontSize, font, color: rgb(0.15, 0.15, 0.15) });
            y -= fontSize + 4;
            line = w;
          } else {
            line = testLine;
          }
        }
        if (line && y >= 60) {
          page.drawText(line, { x: 50, y, size: fontSize, font, color: rgb(0.15, 0.15, 0.15) });
          y -= fontSize + 8;
        }
      };

      drawWrappedText(summary.executiveSummary, 10, fontRegular, 495);
      y -= 15;

      if (y > 200) {
        page.drawText("KEY HIGHLIGHTS", { x: 50, y, size: 12, font: fontBold, color: rgb(0.2, 0.4, 0.8) });
        y -= 20;
        summary.keyPoints.slice(0, 4).forEach((kp) => {
          drawWrappedText(`• ${kp}`, 9.5, fontRegular, 495);
        });
      }

      const pdfBytes = await pdfDoc.save();
      downloadBlob(
        new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" }),
        `${file?.name.replace(/\.pdf$/i, "")}-summary-report.pdf`
      );
      toast.success("Downloaded summary PDF!");
    } catch (e: any) {
      toast.error(`Could not generate PDF: ${e.message}`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setSummary({ executiveSummary: "", keyPoints: [], actionItems: [] });
    setStats({ words: 0, sentences: 0, readingTimeMinutes: 0, topKeywords: [] });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      <ToolHeader
        category="PDF Intelligence"
        title="AI PDF Summarizer"
        description="Extract executive summaries, key bullet points, action items, and topic analytics locally on your browser. Zero cloud upload."
        onReset={handleReset}
      />

      <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs sm:text-sm">
        <Shield className="w-4 h-4 shrink-0" />
        <span>
          <strong>100% Private & Local:</strong> Your PDF text is parsed directly inside your device memory using WebAssembly & client NLP. No data is ever sent to any remote server.
        </span>
      </div>

      {!file ? (
        <FileDropzone
          onFilesSelected={(files) => {
            if (files[0]) void processPdf(files[0]);
          }}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
          title="Drop your PDF to summarize"
          subtitle="Instant executive summary & key insights generated on-device"
        />
      ) : isProcessing ? (
        <div className="p-12 text-center border border-border bg-card rounded-2xl space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <h3 className="text-lg font-semibold">Analyzing PDF Content...</h3>
          <p className="text-sm text-muted-foreground">
            Extracting text, computing term frequencies, and generating executive summary...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} • {pages.length} pages
                </p>
              </div>
            </div>

            {/* Length selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" /> Length:
              </span>
              <div className="flex rounded-lg border border-border p-1 bg-muted/30">
                {(["short", "medium", "detailed"] as const).map((len) => (
                  <button
                    key={len}
                    onClick={() => handleLengthChange(len)}
                    className={`px-3 py-1 text-xs font-medium rounded capitalize transition-colors ${
                      summaryLength === len
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                Copy
              </button>
              <button
                onClick={handleDownloadMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition"
              >
                <Download className="w-3.5 h-3.5" />
                Markdown
              </button>
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <BookOpen className="w-3.5 h-3.5" /> Total Words
              </div>
              <p className="text-2xl font-bold">{stats.words.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Clock className="w-3.5 h-3.5" /> Est. Read Time
              </div>
              <p className="text-2xl font-bold">{stats.readingTimeMinutes} min</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <BarChart2 className="w-3.5 h-3.5" /> Sentences
              </div>
              <p className="text-2xl font-bold">{stats.sentences.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Compression
              </div>
              <p className="text-2xl font-bold">
                {stats.words > 0 ? `${Math.round((summary.executiveSummary.split(" ").length / stats.words) * 100)}%` : "0%"}
              </p>
            </div>
          </div>

          {/* Top Themes */}
          {stats.topKeywords.length > 0 && (
            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Frequent Topics & Keywords
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {stats.topKeywords.map((k) => (
                  <span
                    key={k.word}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    {k.word}
                    <span className="text-[10px] opacity-70">({k.count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Executive Summary */}
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold">Executive Summary</h3>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
              {summary.executiveSummary || "No summary text generated."}
            </p>
          </div>

          {/* Key Takeaways */}
          {summary.keyPoints.length > 0 && (
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-primary" /> Key Highlights
              </h3>
              <ul className="space-y-2.5 text-sm">
                {summary.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed text-foreground/85">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items */}
          {summary.actionItems.length > 0 && (
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" /> Action Items & Goals
              </h3>
              <ul className="space-y-2 text-sm">
                {summary.actionItems.map((action, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    <span className="leading-relaxed text-foreground/85">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
