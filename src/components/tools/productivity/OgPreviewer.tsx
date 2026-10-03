"use client";

import * as React from "react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { toast } from "sonner";
import {
  Share2,
  Copy,
  Check,
  Eye,
  Globe,
  Twitter,
  Linkedin,
  Facebook,
  Upload,
} from "lucide-react";

interface OgData {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  siteName: string;
  twitterCard: "summary_large_image" | "summary";
}

const DEFAULT_OG: OgData = {
  title: "DAN Tools — 100% Private Client-Side Web Utility Suite",
  description:
    "Zero-cloud, high-performance web utility suite. Merge PDFs, compress images, inspect JWTs, convert data, test regex, and build READMEs completely offline in your browser.",
  url: "https://dantools.vercel.app",
  imageUrl: "",
  siteName: "DAN Tools",
  twitterCard: "summary_large_image",
};

export function OgPreviewer() {
  const [data, setData] = React.useState<OgData>(DEFAULT_OG);
  const [activePlatform, setActivePlatform] = React.useState<"google" | "twitter" | "facebook">("twitter");
  const [copiedHtml, setCopiedHtml] = React.useState(false);

  // Handle local image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setData((prev) => ({ ...prev, imageUrl: url }));
      toast.success("Uploaded custom social preview image!");
    }
  };

  // Generate HTML tags
  const generatedHtml = React.useMemo(() => {
    return `<!-- Primary Meta Tags -->
<title>${data.title}</title>
<meta name="title" content="${data.title}">
<meta name="description" content="${data.description}">

<!-- Open Graph / Facebook / LinkedIn -->
<meta property="og:type" content="website">
<meta property="og:url" content="${data.url}">
<meta property="og:title" content="${data.title}">
<meta property="og:description" content="${data.description}">
<meta property="og:image" content="${data.imageUrl}">
<meta property="og:site_name" content="${data.siteName}">

<!-- Twitter -->
<meta property="twitter:card" content="${data.twitterCard}">
<meta property="twitter:url" content="${data.url}">
<meta property="twitter:title" content="${data.title}">
<meta property="twitter:description" content="${data.description}">
<meta property="twitter:image" content="${data.imageUrl}">`;
  }, [data]);

  const copyHtml = () => {
    navigator.clipboard.writeText(generatedHtml);
    setCopiedHtml(true);
    toast.success("Meta tags copied to clipboard!");
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  // Extract clean domain
  const domain = React.useMemo(() => {
    try {
      return new URL(data.url).hostname;
    } catch {
      return "example.com";
    }
  }, [data.url]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        category="Productivity & Text"
        title="Meta Tags & OpenGraph Previewer"
        description="Preview how your pages look when shared across Twitter/X, Facebook, LinkedIn, and Google Search, with ready-to-paste meta tags."
        onReset={() => setData(DEFAULT_OG)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Settings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-foreground">Metadata Properties</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Page Title ({data.title.length}/60 chars)
                </label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => setData({ ...data, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Description ({data.description.length}/160 chars)
                </label>
                <textarea
                  value={data.description}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Canonical URL
                </label>
                <input
                  type="url"
                  value={data.url}
                  onChange={(e) => setData({ ...data, url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Site / Brand Name
                </label>
                <input
                  type="text"
                  value={data.siteName}
                  onChange={(e) => setData({ ...data, siteName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Social Card Image URL
                </label>
                <input
                  type="text"
                  value={data.imageUrl}
                  onChange={(e) => setData({ ...data, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary"
                />
                <div className="mt-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted hover:bg-muted/80 text-xs font-medium text-foreground cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Local Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Copy HTML Snippet */}
          <div className="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Copyable HTML Tags
              </span>

              <button
                onClick={copyHtml}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/90 transition-all"
              >
                {copiedHtml ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy &lt;head&gt; Code</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3.5 rounded-xl bg-muted/40 border border-border font-mono text-xs text-muted-foreground overflow-x-auto max-h-48">
              <code>{generatedHtml}</code>
            </pre>
          </div>
        </div>

        {/* Right Column: Live Platform Mocks */}
        <div className="lg:col-span-7 space-y-5">
          {/* Platform Tab Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePlatform("twitter")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activePlatform === "twitter"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Twitter className="w-3.5 h-3.5" />
              <span>Twitter / X Card</span>
            </button>

            <button
              onClick={() => setActivePlatform("facebook")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activePlatform === "facebook"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Facebook className="w-3.5 h-3.5" />
              <span>Facebook / LinkedIn</span>
            </button>

            <button
              onClick={() => setActivePlatform("google")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activePlatform === "google"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Google SERP</span>
            </button>
          </div>

          {/* Twitter / X Mock */}
          {activePlatform === "twitter" && (
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground font-medium">
                Twitter / X Summary Large Image Card Preview
              </span>
              <div className="rounded-2xl border border-slate-700/40 bg-slate-950 p-4 max-w-lg shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    LT
                  </div>
                  <div>
                    <span className="font-bold text-white">DAN Tools</span>{" "}
                    <span className="text-slate-500">@dantools · Just now</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900">
                  <div className="relative aspect-[1.91/1] w-full bg-slate-800">
                    {data.imageUrl.startsWith("blob:") && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={data.imageUrl}
                        alt="Local social card preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-3.5 space-y-1">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                      {domain}
                    </span>
                    <h4 className="font-bold text-sm text-white line-clamp-1">{data.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {data.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Facebook / LinkedIn Mock */}
          {activePlatform === "facebook" && (
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground font-medium">
                Facebook & LinkedIn Feed Preview
              </span>
              <div className="rounded-2xl border border-border bg-card p-4 max-w-lg shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                    LT
                  </div>
                  <div>
                    <span className="font-bold text-foreground">DAN Tools</span>
                    <p className="text-[11px] text-muted-foreground">Public · Shared a link</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border overflow-hidden bg-muted/30">
                  <div className="relative aspect-[1.91/1] w-full bg-muted">
                    {data.imageUrl.startsWith("blob:") && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={data.imageUrl}
                        alt="Local social card preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-3.5 space-y-1 border-t border-border">
                    <span className="text-[11px] text-muted-foreground uppercase font-mono block">
                      {domain}
                    </span>
                    <h4 className="font-bold text-sm text-foreground line-clamp-1">
                      {data.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {data.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Google SERP Mock */}
          {activePlatform === "google" && (
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground font-medium">
                Google Search Engine Snippet Preview
              </span>
              <div className="rounded-2xl border border-border bg-card p-6 max-w-xl shadow-md space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                    🌐
                  </div>
                  <div>
                    <span className="font-semibold text-foreground text-xs">{data.siteName}</span>
                    <p className="text-[11px] text-muted-foreground font-mono">{data.url}</p>
                  </div>
                </div>

                <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer pt-1 line-clamp-1">
                  {data.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {data.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

