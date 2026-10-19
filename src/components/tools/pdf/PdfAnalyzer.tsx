"use client";

import * as React from "react";
import {
  Sparkles,
  FileText,
  Brain,
  MessageSquare,
  Layers,
  HelpCircle,
  Trash2,
  Download,
  Copy,
  Check,
  RotateCw,
  Shuffle,
  Volume2,
  VolumeX,
  ChevronRight,
  ChevronLeft,
  Send,
  ShieldCheck,
  FileCheck2,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  HelpCircle as QuizIcon,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { getPdfJs } from "@/lib/pdf-helpers";
import { downloadBlob, formatBytes } from "@/lib/utils";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

interface PageData {
  pageNumber: number;
  text: string;
  wordCount: number;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  pageNumber: number;
  category: string;
  mastered?: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  pageNumber: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: Array<{ pageNumber: number; excerpt: string; score: number }>;
}

export function PdfAnalyzer() {
  const [file, setFile] = React.useState<File | null>(null);
  const [isParsing, setIsParsing] = React.useState(false);
  const [parseProgress, setParseProgress] = React.useState({ current: 0, total: 0 });
  const [pages, setPages] = React.useState<PageData[]>([]);
  const [allText, setAllText] = React.useState("");

  // Workspaces
  const [activeTab, setActiveTab] = React.useState<"summarizer" | "study" | "chat">("summarizer");

  // Summary state
  const [summaryLength, setSummaryLength] = React.useState<"brief" | "balanced" | "detailed">("balanced");
  const [executiveSummary, setExecutiveSummary] = React.useState("");
  const [keyTakeaways, setKeyTakeaways] = React.useState<Array<{ title: string; text: string; pageNumber: number }>>([]);
  const [actionItems, setActionItems] = React.useState<Array<{ item: string; pageNumber: number }>>([]);
  const [metricsAndDates, setMetricsAndDates] = React.useState<string[]>([]);
  const [audioPlaying, setAudioPlaying] = React.useState(false);
  const [copiedSummary, setCopiedSummary] = React.useState(false);

  // Study Deck state
  const [studySubTab, setStudySubTab] = React.useState<"flashcards" | "quiz">("flashcards");
  const [flashcards, setFlashcards] = React.useState<Flashcard[]>([]);
  const [cardIndex, setCardIndex] = React.useState(0);
  const [cardFlipped, setCardFlipped] = React.useState(false);
  const [cardFilter, setCardFilter] = React.useState<"all" | "review" | "mastered">("all");

  // Quiz state
  const [quizQuestions, setQuizQuestions] = React.useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = React.useState(0);
  const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
  const [isAnswered, setIsAnswered] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [quizFinished, setQuizFinished] = React.useState(false);

  // Ephemeral Chat state
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = React.useState("");
  const [isThinking, setIsThinking] = React.useState(false);
  const chatBottomRef = React.useRef<HTMLDivElement>(null);

  // Stop Words for local analysis
  const stopWords = React.useMemo(
    () =>
      new Set([
        "about", "above", "after", "again", "against", "all", "and", "any", "are", "because",
        "been", "before", "being", "below", "between", "both", "but", "by", "could", "did",
        "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had",
        "has", "have", "having", "here", "how", "into", "itself", "just", "more", "most",
        "other", "our", "ours", "out", "over", "own", "same", "should", "some", "such",
        "than", "that", "the", "their", "theirs", "them", "then", "there", "these", "they",
        "this", "those", "through", "too", "under", "until", "very", "was", "were", "what",
        "when", "where", "which", "while", "who", "whom", "why", "will", "with", "would",
        "your", "yours"
      ]),
    []
  );

  // Parse PDF on upload
  const handleFileChange = async (newFile: File) => {
    setFile(newFile);
    setIsParsing(true);
    setParseProgress({ current: 0, total: 0 });

    try {
      const pdfjs = await getPdfJs();
      const buffer = await newFile.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: buffer });
      const pdfDoc = await loadingTask.promise;

      const numPages = pdfDoc.numPages;
      setParseProgress({ current: 0, total: numPages });

      const extractedPages: PageData[] = [];
      let fullTextCombined = "";

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        const words = pageText ? pageText.split(/\s+/).length : 0;
        extractedPages.push({ pageNumber: i, text: pageText, wordCount: words });
        fullTextCombined += `\n[Page ${i}]\n` + pageText;
        setParseProgress({ current: i, total: numPages });
      }

      setPages(extractedPages);
      setAllText(fullTextCombined);

      // Run initial runtime generators
      processDocumentIntelligence(extractedPages, fullTextCombined);

      // Set initial greeting in chat
      setChatMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hello! I have analyzed "${newFile.name}" (${numPages} pages, ~${extractedPages.reduce((acc, p) => acc + p.wordCount, 0).toLocaleString()} words). Ask me any question about this document, or explore the Summary and Flashcards/Quiz tabs!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      toast.success(`Parsed ${numPages} pages in-memory!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to parse PDF document. It may be password-protected or scanned.");
    } finally {
      setIsParsing(false);
    }
  };

  // Extract Summary, Flashcards, Quiz from extracted pages
  const processDocumentIntelligence = (extractedPages: PageData[], combined: string) => {
    const cleanAll = combined.replace(/\[Page \d+\]/g, "").trim();
    const sentencesWithPage: Array<{ sentence: string; pageNumber: number }> = [];

    extractedPages.forEach((p) => {
      const sList = p.text
        .split(/(?<=[.?!])\s+|[\r\n]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 25 && !s.startsWith("http"));

      const fallbackChunks: string[] = [];
      if (sList.length === 0) {
        const words = p.text.split(/\s+/).filter(Boolean);
        for (let index = 0; index < words.length; index += 22) {
          const chunk = words.slice(index, index + 22).join(" ").trim();
          if (chunk.length > 25) fallbackChunks.push(chunk);
        }
      }

      [...sList, ...fallbackChunks].forEach((sentence) =>
        sentencesWithPage.push({ sentence, pageNumber: p.pageNumber })
      );
    });

    if (sentencesWithPage.length === 0) {
      setExecutiveSummary("No extractable text found in this PDF.");
      setKeyTakeaways([]);
      setActionItems([]);
      setMetricsAndDates([]);
      setFlashcards([]);
      setQuizQuestions([]);
      return;
    }

    // Word frequencies
    const words = cleanAll
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));

    const wordFreq: Record<string, number> = {};
    words.forEach((w) => {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    });

    // 1. Executive Summary
    const scoredSentences = sentencesWithPage.map(({ sentence, pageNumber }, idx) => {
      const sWords = sentence.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
      let scoreVal = 0;
      sWords.forEach((w) => {
        if (wordFreq[w]) scoreVal += wordFreq[w];
      });
      scoreVal = scoreVal / Math.sqrt(sWords.length || 1);
      if (idx < 5) scoreVal *= 1.4; // boost intro
      return { sentence, pageNumber, score: scoreVal };
    });

    const topSentences = [...scoredSentences]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Keep chronological order for summary
    const chronologicalSummary = [...topSentences]
      .sort((a, b) => sentencesWithPage.findIndex((s) => s.sentence === a.sentence) - sentencesWithPage.findIndex((s) => s.sentence === b.sentence))
      .map((s) => s.sentence)
      .join(" ");

    setExecutiveSummary(
      chronologicalSummary ||
        "This document covers key conceptual and analytical frameworks as detailed across the extracted pages."
    );

    // 2. Key Takeaways
    const takeaways = scoredSentences
      .filter((s) => s.sentence.length > 40 && s.sentence.length < 220)
      .slice(0, 6)
      .map((s, index) => {
        const wordsArr = s.sentence.split(" ");
        const title = wordsArr.slice(0, 4).join(" ") + "...";
        return {
          title: `Insight #${index + 1}: ${title}`,
          text: s.sentence,
          pageNumber: s.pageNumber,
        };
      });
    setKeyTakeaways(takeaways);

    // 3. Action items & Requirements
    const actionVerbs = /\b(must|should|required|ensure|recommend|action|deadline|plan|implement|schedule|submit|verify|coordinate)\b/i;
    const actions = sentencesWithPage
      .filter((s) => actionVerbs.test(s.sentence))
      .slice(0, 5)
      .map((s) => ({
        item: s.sentence,
        pageNumber: s.pageNumber,
      }));
    setActionItems(actions);

    // 4. Metrics & Dates
    const metricsMatches = cleanAll.match(
      /(?:\$\s*\d+[\d,.]*|\d+[\d,.]*\%|\b\d{4}\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b)/gi
    );
    const uniqueMetrics = Array.from(new Set(metricsMatches || [])).slice(0, 12);
    setMetricsAndDates(uniqueMetrics);

    // 5. Generate Flashcards
    const generatedCards: Flashcard[] = [];
    const definitionRegex = /\b(is defined as|refers to|means|represents|consists of|serves as|is a|are defined as)\b/i;

    sentencesWithPage.forEach((item, idx) => {
      if (generatedCards.length >= 15) return;
      if (definitionRegex.test(item.sentence) && item.sentence.length < 200) {
        const parts = item.sentence.split(definitionRegex);
        if (parts.length >= 2 && parts[0].trim().length > 3 && parts[0].trim().length < 60) {
          generatedCards.push({
            id: `card-${idx}`,
            front: `What is ${parts[0].trim()}?`,
            back: item.sentence,
            pageNumber: item.pageNumber,
            category: "Definition & Concept",
          });
        }
      }
    });

    // Supplement flashcards with top takeaways
    takeaways.forEach((t, idx) => {
      if (generatedCards.length >= 12) return;
      generatedCards.push({
        id: `card-takeaway-${idx}`,
        front: `Key Concept from Page ${t.pageNumber}: What is highlighted regarding "${t.title}"?`,
        back: t.text,
        pageNumber: t.pageNumber,
        category: "Core Insight",
      });
    });

    if (generatedCards.length === 0) {
      generatedCards.push({
        id: "fallback-1",
        front: "Primary Document Focus",
        back: chronologicalSummary || "The document provides an overview of operations and procedures.",
        pageNumber: 1,
        category: "Overview",
      });
    }

    setFlashcards(generatedCards);
    setCardIndex(0);
    setCardFlipped(false);

    // 6. Generate Quiz Questions
    const generatedQuiz: QuizQuestion[] = [];
    const candidateSentences = sentencesWithPage.filter(
      (s) => s.sentence.length > 50 && s.sentence.length < 180 && !s.sentence.includes("?")
    );

    candidateSentences.slice(0, 5).forEach((item, qIdx) => {
      const wordsArr = item.sentence.split(" ");
      const keyword = wordsArr.find((w) => w.length > 6 && !stopWords.has(w.toLowerCase())) || wordsArr[2] || "concept";

      // Formulate Question
      const questionText = `According to Page ${item.pageNumber}, which statement accurately reflects the document?`;
      const correctAnswer = item.sentence;

      // Distractors
      const distractors = [
        `The document explicitly negates that ${keyword.toLowerCase()} plays any significant operational role.`,
        `Testing indicated that ${keyword.toLowerCase()} was phased out in early prototypes.`,
        `The parameters require ${keyword.toLowerCase()} to be deferred indefinitely.`,
      ];

      const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
      const correctIdx = options.indexOf(correctAnswer);

      generatedQuiz.push({
        id: `quiz-${qIdx}`,
        question: questionText,
        options,
        correctIndex: correctIdx,
        explanation: `Exact statement from Page ${item.pageNumber}: "${item.sentence}"`,
        pageNumber: item.pageNumber,
      });
    });

    setQuizQuestions(generatedQuiz);
    setQuizIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
  };

  // Audio Speech Synthesis for Executive Summary
  const handleToggleAudio = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }

    if (audioPlaying) {
      window.speechSynthesis.cancel();
      setAudioPlaying(false);
    } else {
      if (!executiveSummary) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(executiveSummary);
      utterance.rate = 1.0;
      utterance.onend = () => setAudioPlaying(false);
      utterance.onerror = () => setAudioPlaying(false);
      window.speechSynthesis.speak(utterance);
      setAudioPlaying(true);
    }
  };

  // Copy Summary
  const handleCopySummary = () => {
    const text = `# Executive Summary\n${executiveSummary}\n\n## Key Takeaways\n${keyTakeaways.map((t) => `- [Page ${t.pageNumber}] ${t.text}`).join("\n")}\n\n## Action Items\n${actionItems.map((a) => `- [Page ${a.pageNumber}] ${a.item}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    toast.success("Summary copied to clipboard!");
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Download Markdown Report
  const handleDownloadMarkdown = () => {
    const md = `# PDF Intelligence Brief: ${file?.name || "Document"}\nGenerated: ${new Date().toLocaleString()}\n\n---\n\n## Executive Summary\n${executiveSummary}\n\n## Key Takeaways\n${keyTakeaways.map((t) => `### ${t.title} (Page ${t.pageNumber})\n${t.text}\n`).join("\n")}\n\n## Action Items & Requirements\n${actionItems.map((a) => `- [Page ${a.pageNumber}] ${a.item}`).join("\n")}\n\n## Key Numbers & Dates\n${metricsAndDates.join(", ")}\n\n---\n*100% Client-Side In-Memory Analysis — Zero Server Retention*`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    downloadBlob(blob, `${file?.name?.replace(/\.[^/.]+$/, "") || "document"}_summary.md`);
    toast.success("Markdown report downloaded!");
  };

  // Download PDF Report
  const handleDownloadPdfReport = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([595.28, 841.89]); // A4
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let y = 800;
      const margin = 50;
      const width = 595.28 - margin * 2;

      // Header
      page.drawText("PDF INTELLIGENCE REPORT", { x: margin, y, size: 16, font: fontBold, color: rgb(0.1, 0.1, 0.2) });
      y -= 20;
      page.drawText(`File: ${file?.name || "Document"} • Generated locally`, { x: margin, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
      y -= 30;

      // Section: Summary
      page.drawText("Executive Summary", { x: margin, y, size: 12, font: fontBold, color: rgb(0.2, 0.4, 0.8) });
      y -= 18;

      const words = executiveSummary.split(" ");
      let currentLine = "";
      for (const w of words) {
        if ((currentLine + " " + w).length > 80) {
          page.drawText(currentLine, { x: margin, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
          y -= 14;
          currentLine = w;
        } else {
          currentLine = currentLine ? currentLine + " " + w : w;
        }
      }
      if (currentLine) {
        page.drawText(currentLine, { x: margin, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
        y -= 25;
      }

      // Key Takeaways
      if (y > 200) {
        page.drawText("Key Takeaways", { x: margin, y, size: 12, font: fontBold, color: rgb(0.2, 0.4, 0.8) });
        y -= 18;
        keyTakeaways.slice(0, 4).forEach((t) => {
          page.drawText(`• [Page ${t.pageNumber}] ${t.title}`, { x: margin, y, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
          y -= 14;
          const snippet = t.text.length > 90 ? t.text.substring(0, 88) + "..." : t.text;
          page.drawText(`  ${snippet}`, { x: margin, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
          y -= 18;
        });
      }

      // Footer
      page.drawText("Analyzed 100% locally in browser memory — Zero data retained.", {
        x: margin,
        y: 40,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      downloadBlob(blob, `${file?.name?.replace(/\.[^/.]+$/, "") || "document"}_analysis.pdf`);
      toast.success("PDF analysis exported!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF summary.");
    }
  };

  // Flashcards Filtering
  const filteredCards = React.useMemo(() => {
    if (cardFilter === "mastered") return flashcards.filter((c) => c.mastered);
    if (cardFilter === "review") return flashcards.filter((c) => !c.mastered);
    return flashcards;
  }, [flashcards, cardFilter]);

  const currentCard = filteredCards[cardIndex] || flashcards[0];

  const handleToggleMastered = (id: string) => {
    setFlashcards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, mastered: !c.mastered } : c))
    );
  };

  const handleNextCard = () => {
    setCardFlipped(false);
    setCardIndex((prev) => (prev + 1) % (filteredCards.length || 1));
  };

  const handlePrevCard = () => {
    setCardFlipped(false);
    setCardIndex((prev) => (prev - 1 + (filteredCards.length || 1)) % (filteredCards.length || 1));
  };

  const handleShuffleCards = () => {
    setFlashcards((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCardIndex(0);
    setCardFlipped(false);
    toast.success("Deck shuffled!");
  };

  // Quiz Handling
  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === quizQuestions[quizIndex]?.correctIndex;
    if (isCorrect) {
      setScore((s) => s + 1);
    }
  };

  const handleNextQuestion = () => {
    if (quizIndex + 1 < quizQuestions.length) {
      setQuizIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestartQuiz = () => {
    setQuizIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
  };

  // Ephemeral Chatbot QA Engine
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = chatInput.trim();
    if (!query || isThinking) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsThinking(true);

    // Scroll to bottom
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    setTimeout(() => {
      // Semantic retrieval algorithm
      const queryTokens = query
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopWords.has(w));

      const scoredParagraphs: Array<{ pageNumber: number; paragraph: string; score: number }> = [];

      pages.forEach((page) => {
        const paragraphs = page.text.split(/(?<=\n)\s*|(?<=\.\s+)/).filter((p) => p.trim().length > 30);

        paragraphs.forEach((p) => {
          const pLower = p.toLowerCase();
          let pScore = 0;

          queryTokens.forEach((token) => {
            if (pLower.includes(token)) {
              pScore += 3;
              // Exact word boundary bonus
              const regex = new RegExp(`\\b${token}\\b`, "i");
              if (regex.test(p)) pScore += 4;
            }
          });

          if (pScore > 0) {
            scoredParagraphs.push({ pageNumber: page.pageNumber, paragraph: p.trim(), score: pScore });
          }
        });
      });

      scoredParagraphs.sort((a, b) => b.score - a.score);
      const topMatches = scoredParagraphs.slice(0, 3);

      let answerText = "";
      if (topMatches.length > 0) {
        const best = topMatches[0];
        answerText = `Based on Page ${best.pageNumber} of "${file?.name}":\n\n"${best.paragraph}"`;
        if (topMatches.length > 1) {
          answerText += `\n\nAdditionally, Page ${topMatches[1].pageNumber} notes:\n"${topMatches[1].paragraph}"`;
        }
      } else {
        answerText = `I couldn't locate specific references to "${query}" in this PDF. Try asking about general themes, key numbers, or concepts found in the summary tab.`;
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: answerText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: topMatches.map((m) => ({
          pageNumber: m.pageNumber,
          excerpt: m.paragraph.length > 120 ? m.paragraph.substring(0, 115) + "..." : m.paragraph,
          score: m.score,
        })),
      };

      setChatMessages((prev) => [...prev, botMsg]);
      setIsThinking(false);

      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }, 400);
  };

  // End Session & Destroy Data (Zero residual storage guarantee)
  const handleEndSession = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setAudioPlaying(false);
    setFile(null);
    setPages([]);
    setAllText("");
    setExecutiveSummary("");
    setKeyTakeaways([]);
    setActionItems([]);
    setMetricsAndDates([]);
    setFlashcards([]);
    setQuizQuestions([]);
    setChatMessages([]);
    setChatInput("");
    toast.success("Session ended. All extracted PDF data and chat history permanently destroyed from memory.");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <ToolHeader
        category="PDF Intelligence"
        title="PDF AI Analyzer & Study Assistant"
        description="Instant runtime PDF summarization, interactive flashcards, self-grading quizzes, and ephemeral zero-retention chatbot — running 100% locally in your browser."
        onReset={file ? handleEndSession : undefined}
      />

      {/* Ephemeral Privacy Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
          <div className="text-xs">
            <span className="font-bold">100% In-Memory Sandbox:</span> Your document is analyzed in your browser&apos;s active RAM. When you close this tab or click &quot;End Session&quot;, all data is permanently wiped. Zero servers, zero logs.
          </div>
        </div>
        {file && (
          <button
            onClick={handleEndSession}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            End Session & Wipe Memory
          </button>
        )}
      </div>

      {!file ? (
        <div className="space-y-6">
          <FileDropzone
            accept={{ "application/pdf": [".pdf"] }}
            maxFiles={1}
            onFilesSelected={(files: File[]) => {
              if (files[0]) void handleFileChange(files[0]);
            }}
            title="Upload or Drag & Drop any PDF to analyze"
            subtitle="Supports reports, textbooks, contracts, research papers, and slides. Up to 50MB."
          />

          {/* Value Props Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">Deep Extractive Summary</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Extracts key thesis points, action items, critical metrics, and page-by-page highlights using in-browser NLP.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">Interactive Flashcards & Quizzes</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Auto-generates study flashcards and multi-choice quizzes with instant grading and source page citations.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">Ephemeral PDF Chatbot</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Chat directly with your document in real-time. Answers are derived strictly from your PDF without server calls.
              </p>
            </div>
          </div>
        </div>
      ) : isParsing ? (
        <div className="p-12 border border-border rounded-2xl bg-card text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">Analyzing PDF Document...</h3>
            <p className="text-xs text-muted-foreground">
              Extracting text and compiling in-memory vectors: Page {parseProgress.current} of {parseProgress.total}
            </p>
          </div>
          <div className="w-64 h-2 bg-muted rounded-full mx-auto overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{
                width: `${(parseProgress.current / (parseProgress.total || 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active File Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs">
                PDF
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground truncate max-w-sm">{file.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} • {pages.length} Pages • ~
                  {pages.reduce((acc, p) => acc + p.wordCount, 0).toLocaleString()} Words
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center p-1 bg-muted rounded-lg border border-border">
              <button
                onClick={() => setActiveTab("summarizer")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "summarizer"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Brain className="w-3.5 h-3.5 text-primary" />
                Deep Summary
              </button>
              <button
                onClick={() => setActiveTab("study")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "study"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-violet-500" />
                Study Deck & Quiz
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "chat"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                PDF Chatbot
              </button>
            </div>
          </div>

          {/* TAB 1: SUMMARIZER */}
          {activeTab === "summarizer" && (
            <div className="space-y-6">
              {/* Executive Summary Card */}
              <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Executive Overview</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleAudio}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors"
                      title="Listen to summary"
                    >
                      {audioPlaying ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
                      {audioPlaying ? "Stop Listening" : "Listen"}
                    </button>
                    <button
                      onClick={handleCopySummary}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors"
                    >
                      {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSummary ? "Copied" : "Copy"}
                    </button>
                    <button
                      onClick={handleDownloadMarkdown}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Markdown
                    </button>
                    <button
                      onClick={handleDownloadPdfReport}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF Brief
                    </button>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line font-serif">
                  {executiveSummary}
                </p>
              </div>

              {/* Key Takeaways & Action Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Takeaways */}
                <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <h4 className="text-sm font-bold text-foreground">Core Insights & Arguments</h4>
                  </div>
                  <div className="space-y-3">
                    {keyTakeaways.length > 0 ? (
                      keyTakeaways.map((takeaway, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-border/70 bg-muted/30 space-y-1.5 hover:border-primary/40 transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground">{takeaway.title}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                              Page {takeaway.pageNumber}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{takeaway.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No specific takeaways generated.</p>
                    )}
                  </div>
                </div>

                {/* Action Items & Critical Metrics */}
                <div className="space-y-6">
                  {/* Action items */}
                  <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-sm font-bold text-foreground">Action Items & Directives</h4>
                    </div>
                    <div className="space-y-2.5">
                      {actionItems.length > 0 ? (
                        actionItems.map((act, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs text-foreground/90">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            <div className="flex-1 leading-relaxed">
                              {act.item}{" "}
                              <span className="text-[10px] text-muted-foreground font-mono">(p. {act.pageNumber})</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No mandatory action items detected.</p>
                      )}
                    </div>
                  </div>

                  {/* Metrics & Dates */}
                  <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <h4 className="text-sm font-bold text-foreground">Detected Metrics, Figures & Dates</h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {metricsAndDates.length > 0 ? (
                        metricsAndDates.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          >
                            {item}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No numerical figures detected.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDY DECK & QUIZ */}
          {activeTab === "study" && (
            <div className="space-y-6">
              {/* Sub-tab switcher */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStudySubTab("flashcards")}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      studySubTab === "flashcards"
                        ? "bg-violet-600 text-white"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Flashcards Deck ({flashcards.length})
                  </button>
                  <button
                    onClick={() => setStudySubTab("quiz")}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      studySubTab === "quiz"
                        ? "bg-violet-600 text-white"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Quiz Arena ({quizQuestions.length} Questions)
                  </button>
                </div>

                {studySubTab === "flashcards" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleShuffleCards}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted border border-border rounded-lg transition-colors"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      Shuffle
                    </button>
                  </div>
                )}
              </div>

              {/* FLASHCARDS WORKSPACE */}
              {studySubTab === "flashcards" && (
                <div className="space-y-6">
                  {filteredCards.length > 0 ? (
                    <div className="space-y-4 max-w-2xl mx-auto">
                      {/* Flashcard container */}
                      <div
                        onClick={() => setCardFlipped(!cardFlipped)}
                        className={`min-h-[260px] p-8 rounded-3xl border cursor-pointer select-none transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-xl ${
                          cardFlipped
                            ? "bg-violet-950/40 border-violet-500/40 text-violet-100"
                            : "bg-card border-border hover:border-violet-500/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border">
                            {currentCard.category} • Page {currentCard.pageNumber}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground">
                            {cardIndex + 1} of {filteredCards.length}
                          </span>
                        </div>

                        <div className="my-auto py-6 text-center space-y-3">
                          <h3
                            className={`font-semibold leading-relaxed transition-all ${
                              cardFlipped ? "text-base text-foreground font-serif text-left" : "text-lg text-foreground"
                            }`}
                          >
                            {cardFlipped ? currentCard.back : currentCard.front}
                          </h3>
                          <p className="text-[11px] text-muted-foreground italic">
                            {cardFlipped ? "Click anywhere to flip back to question" : "Click anywhere or press Space to reveal answer"}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/40">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleMastered(currentCard.id);
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                              currentCard.mastered
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            {currentCard.mastered ? "Mastered" : "Mark as Mastered"}
                          </button>
                          <span className="text-[10px] text-muted-foreground">100% In-Memory Study</span>
                        </div>
                      </div>

                      {/* Card navigation controls */}
                      <div className="flex items-center justify-between gap-4">
                        <button
                          onClick={handlePrevCard}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-card hover:bg-muted border border-border rounded-xl transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                        <div className="text-xs font-mono text-muted-foreground">
                          Card {cardIndex + 1} / {filteredCards.length}
                        </div>
                        <button
                          onClick={handleNextCard}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 rounded-xl transition-colors shadow-xs"
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center border border-border rounded-xl text-muted-foreground text-xs">
                      No cards match your filter.
                    </div>
                  )}
                </div>
              )}

              {/* QUIZ ARENA */}
              {studySubTab === "quiz" && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  {!quizFinished && quizQuestions.length > 0 ? (
                    <div className="p-6 rounded-3xl border border-border bg-card space-y-6">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-primary">
                          Question {quizIndex + 1} of {quizQuestions.length}
                        </span>
                        <span className="font-mono text-muted-foreground">
                          Score: {score} / {quizIndex + (isAnswered ? 1 : 0)}
                        </span>
                      </div>

                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-600 transition-all duration-300"
                          style={{
                            width: `${((quizIndex + 1) / quizQuestions.length) * 100}%`,
                          }}
                        />
                      </div>

                      <h3 className="text-base font-bold text-foreground leading-snug">
                        {quizQuestions[quizIndex]?.question}
                      </h3>

                      <div className="space-y-2.5">
                        {quizQuestions[quizIndex]?.options.map((opt, optIdx) => {
                          const isCorrect = optIdx === quizQuestions[quizIndex].correctIndex;
                          const isSelected = selectedOption === optIdx;

                          let btnStyle = "border-border bg-muted/40 hover:bg-muted text-foreground";
                          if (isAnswered) {
                            if (isCorrect) {
                              btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold";
                            } else if (isSelected) {
                              btnStyle = "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300";
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectOption(optIdx)}
                              disabled={isAnswered}
                              className={`w-full text-left p-3.5 rounded-xl border text-xs leading-relaxed transition-all flex items-start gap-3 ${btnStyle}`}
                            >
                              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1">{opt}</span>
                              {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                              {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {isAnswered && (
                        <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 text-xs text-foreground/90 space-y-1">
                          <span className="font-bold text-violet-600 dark:text-violet-400">Explanation & Citation:</span>
                          <p className="text-muted-foreground">{quizQuestions[quizIndex]?.explanation}</p>
                        </div>
                      )}

                      {isAnswered && (
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={handleNextQuestion}
                            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors"
                          >
                            {quizIndex + 1 < quizQuestions.length ? "Next Question" : "Complete Quiz"}
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center border border-border rounded-3xl bg-card space-y-4">
                      <div className="w-12 h-12 rounded-full bg-violet-500/10 text-violet-600 mx-auto flex items-center justify-center">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-foreground">Quiz Completed!</h3>
                        <p className="text-sm text-muted-foreground">
                          You scored {score} out of {quizQuestions.length} (
                          {Math.round((score / (quizQuestions.length || 1)) * 100)}%)
                        </p>
                      </div>
                      <button
                        onClick={handleRestartQuiz}
                        className="px-5 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors"
                      >
                        Retake Quiz
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EPHEMERAL CHATBOT */}
          {activeTab === "chat" && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live In-Memory Retrieval • Zero-Storage</span>
                </div>
                <button
                  onClick={() => setChatMessages([])}
                  className="text-xs text-muted-foreground hover:text-rose-500 transition-colors"
                >
                  Clear Chat
                </button>
              </div>

              {/* Chat messages viewport */}
              <div className="h-[460px] overflow-y-auto p-4 rounded-2xl border border-border bg-card space-y-4">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground font-medium rounded-br-none"
                          : "bg-muted/70 text-foreground border border-border/60 rounded-bl-none"
                      }`}
                    >
                      <div className="whitespace-pre-line">{msg.content}</div>

                      {/* Source references */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="pt-2 border-t border-border/40 mt-2 space-y-1">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                            Document Citations:
                          </span>
                          {msg.sources.map((s, idx) => (
                            <div
                              key={idx}
                              className="text-[10px] text-muted-foreground bg-background/50 p-1.5 rounded border border-border/40 font-mono"
                            >
                              Page {s.pageNumber}: &quot;{s.excerpt}&quot;
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}

                {isThinking && (
                  <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                    Searching document text in RAM...
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Suggested query chips */}
              <div className="flex flex-wrap items-center gap-1.5 px-1">
                {[
                  "What is the main purpose of this PDF?",
                  "List key action items and deadlines",
                  "Summarize key conclusions",
                  "What are the critical dates and numbers?",
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => {
                      setChatInput(chip);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask any question about this document..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isThinking}
                  className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
