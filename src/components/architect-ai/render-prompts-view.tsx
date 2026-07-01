"use client";

import { useState } from "react";
import { Copy, Check, AlertCircle, Sparkles, Loader2, Download, Maximize2, X, RefreshCw } from "lucide-react";
import type { ProjectBrief, ArchitectReport } from "@/lib/domain/types";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const STYLE_MAP: Record<string, string> = {
  economic: "clean modern economic architecture",
  modern_luxury: "ultra-modern luxury architecture, travertine stone facade, dark aluminum louvers, reflective grey glass",
  neoclassic: "neoclassical architecture with ornate details, classical columns, grand entrance",
  contemporary: "contemporary minimalist architecture, clean lines, large glass panels",
  max_roi: "efficient modern architecture, maximised floor plates, clean functional design",
};

const TYPE_MAP: Record<string, string> = {
  residential_apartments: "residential apartment building",
  villa: "luxury private villa",
  residential_complex: "residential compound",
  commercial: "commercial building",
  mixed_use: "mixed-use development",
  office: "office tower",
};

type ViewKey = "day" | "night" | "entrance" | "lobby" | "garden" | "aerial" | "street" | "rear";

function buildPrompts(brief: ProjectBrief, report: ArchitectReport): Record<ViewKey, string> {
  const style = STYLE_MAP[brief.designStyle] ?? "modern architecture";
  const type = TYPE_MAP[brief.projectType] ?? "building";
  const location = `${brief.city ?? "Saudi Arabia"}${brief.district ? ", " + brief.district : ""}`;
  const floors = brief.floors ?? 4;
  const facade = report.facade?.slice(0, 120) ?? "";
  const base = `Ultra-realistic architectural render, ${type}, ${style}, ${floors}-storey building, ${location}${facade ? ", " + facade : ""}, Saudi Arabian architecture, photorealistic, 8K, sharp details, professional architectural photography`;

  return {
    day:      `${base}, daytime exterior, golden hour lighting, blue sky, wide-angle lens, dramatic shadows, masterpiece`,
    night:    `${base}, night exterior, stunning illuminated facade, ambient city lights, long exposure, cinematic mood, masterpiece`,
    entrance: `${base}, close-up main entrance, dramatic entry portal, luxury landscaping, warm lighting, eye-level, masterpiece`,
    lobby:    `Interior photorealistic render, ${type} lobby, ${style}, ${location}, high ceiling atrium, marble flooring, reception desk, luxury interior, dramatic lighting, wide-angle lens, masterpiece`,
    garden:   `${base}, garden and landscape, lush greenery, water features, outdoor seating areas, afternoon sunlight, lifestyle photography, masterpiece`,
    aerial:   `${base}, aerial bird's eye view, urban context, surrounding streets, drone photography, golden hour, wide establishing shot, masterpiece`,
    street:   `${base}, street-level pedestrian view, people walking, retail ground floor, human scale, 35mm lens, vibrant atmosphere, masterpiece`,
    rear:     `${base}, rear elevation, back garden, clean minimalist back facade, soft daylight, architectural documentation style, masterpiece`,
  };
}

function buildImageUrl(prompt: string): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux-realism&width=1024&height=576&nologo=true&enhance=false&seed=${Math.floor(Math.random() * 99999)}`;
}

// ─── Per-card component ───────────────────────────────────────────────────────
function PromptCard({
  viewKey,
  label,
  icon,
  prompt,
  locale,
  copyLabel,
  copiedLabel,
}: {
  viewKey: ViewKey;
  label: string;
  icon: string;
  prompt: string;
  locale: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  async function copyText() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(prompt);
      } else {
        const el = document.createElement("textarea");
        el.value = prompt;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  }

  function generateImage() {
    setImgError(false);
    setGenerating(true);
    setImageUrl(null);
    const url = buildImageUrl(prompt);
    const img = new window.Image();
    img.onload = () => { setImageUrl(url); setGenerating(false); };
    img.onerror = () => { setImgError(true); setGenerating(false); };
    img.src = url;
  }

  function regenImage() {
    setImageUrl(null);
    generateImage();
  }

  function downloadImage() {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `render-${viewKey}.jpg`;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  }

  return (
    <>
      <div className="mnc-card overflow-hidden p-0">
        {/* Card header */}
        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-base">{icon}</span>
            {label}
          </span>
          <button
            onClick={copyText}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors",
              copyError
                ? "border-destructive/40 text-destructive"
                : copied
                ? "border-emerald-500/40 text-emerald-600"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
            )}
          >
            {copyError ? (
              <AlertCircle className="size-3" />
            ) : copied ? (
              <Check className="size-3" />
            ) : (
              <Copy className="size-3" />
            )}
            {copyError ? (locale === "ar" ? "فشل النسخ" : "Failed") : copied ? copiedLabel : copyLabel}
          </button>
        </div>

        {/* Prompt text */}
        <div className="mx-4 mb-3 rounded-lg border border-border bg-muted/50 p-3" dir="ltr">
          <p className="select-all font-mono text-[10px] leading-relaxed text-foreground/80 line-clamp-3">
            {prompt}
          </p>
        </div>

        {/* Generated image */}
        {imageUrl && !imgError && (
          <div className="relative mx-4 mb-3 overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={label}
              className="w-full object-cover"
              style={{ maxHeight: 280 }}
            />
            {/* Image overlay actions */}
            <div className="absolute inset-0 flex items-end justify-end gap-1.5 bg-gradient-to-t from-black/60 via-transparent to-transparent p-2 opacity-0 transition-opacity hover:opacity-100">
              <button
                onClick={() => setLightbox(true)}
                className="flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-[10px] text-white backdrop-blur-sm hover:bg-white/25"
              >
                <Maximize2 className="size-3" />
                {locale === "ar" ? "تكبير" : "Full"}
              </button>
              <button
                onClick={downloadImage}
                className="flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-[10px] text-white backdrop-blur-sm hover:bg-white/25"
              >
                <Download className="size-3" />
                {locale === "ar" ? "تحميل" : "Save"}
              </button>
              <button
                onClick={regenImage}
                className="flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-[10px] text-white backdrop-blur-sm hover:bg-white/25"
              >
                <RefreshCw className="size-3" />
                {locale === "ar" ? "جديد" : "New"}
              </button>
            </div>
          </div>
        )}

        {/* Error state */}
        {imgError && (
          <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0" />
            {locale === "ar" ? "فشل التوليد — تأكد من الاتصال بالإنترنت وأعد المحاولة" : "Generation failed — check internet connection and retry"}
          </div>
        )}

        {/* Generate button */}
        <div className="px-4 pb-4">
          <button
            onClick={imageUrl ? regenImage : generateImage}
            disabled={generating}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all",
              generating
                ? "cursor-not-allowed border border-border bg-muted text-muted-foreground"
                : imageUrl
                ? "border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {generating ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                {locale === "ar" ? "جاري توليد الصورة…" : "Generating image…"}
              </>
            ) : imageUrl ? (
              <>
                <RefreshCw className="size-3.5" />
                {locale === "ar" ? "توليد صورة جديدة" : "Generate new image"}
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" />
                {locale === "ar" ? "توليد صورة واقعية" : "Generate realistic image"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && imageUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={label}
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 flex gap-2">
            <button
              onClick={downloadImage}
              className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm text-white backdrop-blur-sm hover:bg-white/25"
            >
              <Download className="size-4" />
              {locale === "ar" ? "تحميل الصورة" : "Download"}
            </button>
            <button
              onClick={() => { regenImage(); setLightbox(false); }}
              className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm text-white backdrop-blur-sm hover:bg-white/25"
            >
              <RefreshCw className="size-4" />
              {locale === "ar" ? "توليد جديد" : "Regenerate"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────
export function RenderPromptsView({ brief, report }: { brief: ProjectBrief; report: ArchitectReport }) {
  const { t, locale } = useI18n();
  const rp = t.architectAi.prompts;

  const prompts = buildPrompts(brief, report);
  const views = Object.keys(prompts) as ViewKey[];

  const viewIcons: Record<ViewKey, string> = {
    day: "🌅", night: "🌙", entrance: "🚪", lobby: "🏛️",
    garden: "🌿", aerial: "🛸", street: "🚶", rear: "↩️",
  };

  const [allGenerating, setAllGenerating] = useState(false);

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>
          {locale === "ar"
            ? "اضغط «توليد صورة واقعية» على أي زاوية لإنشاء صورة فوتوغرافية معمارية مباشرة — مجاني بدون مفتاح API"
            : "Click «Generate realistic image» on any view to create a photorealistic architectural render — free, no API key required"}
        </span>
      </div>

      {/* Prompt cards grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {views.map((key) => (
          <PromptCard
            key={key}
            viewKey={key}
            label={(rp.view_labels as Record<string, string>)[key] ?? key}
            icon={viewIcons[key]}
            prompt={prompts[key]}
            locale={locale}
            copyLabel={rp.copy}
            copiedLabel={rp.copied}
          />
        ))}
      </div>

      {/* Base prompt from report */}
      {report.imagePrompt && (
        <PromptCard
          viewKey={"day" as ViewKey}
          label={locale === "ar" ? "البرومبت الأساسي من التقرير" : "Base Prompt from Report"}
          icon="🎨"
          prompt={report.imagePrompt}
          locale={locale}
          copyLabel={rp.copy}
          copiedLabel={rp.copied}
        />
      )}
    </div>
  );
}
