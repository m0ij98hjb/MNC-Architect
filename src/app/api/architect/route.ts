import { NextRequest, NextResponse } from "next/server";
import type { ArchitectReport, ProjectBrief } from "@/lib/domain/types";
import {
  MNC_ARCHITECT_SYSTEM_PROMPT,
  buildArchitectUserMessage,
} from "@/lib/ai/agent";
import { buildDemoReport } from "@/lib/calc/engineering";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

/**
 * POST /api/architect
 * body: { brief: ProjectBrief, extra?: string }
 *
 * يستدعي وكيل MNC Architect عبر Anthropic SDK ويعيد تقريراً من 16 قسماً.
 * في حال عدم وجود ANTHROPIC_API_KEY، يرجع تقريراً تجريبياً مبنياً بالمعادلات
 * حتى يبقى التطبيق قابلاً للتشغيل فوراً (Demo Mode).
 */
export async function POST(req: NextRequest) {
  let body: { brief?: ProjectBrief; extra?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const brief = body.brief;
  if (!brief || !brief.city || !brief.landArea || !brief.projectType) {
    return NextResponse.json({ error: "MISSING_BRIEF" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // ===== Demo Mode: لا يوجد مفتاح، نبني التقرير بالمعادلات =====
  if (!apiKey) {
    const report = buildDemoReport(brief);
    return NextResponse.json({ report, demo: true });
  }

  // ===== Production: استدعاء Anthropic =====
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const userMessage = buildArchitectUserMessage(brief, body.extra);

    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: MNC_ARCHITECT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = resp.content
      .filter((b) => b.type === "text")
      .map((b) => ("text" in b ? b.text : ""))
      .join("\n");

    const parsed = extractJson(text);
    if (!parsed) {
      // fallback آمن: لو فشل التحليل، نعيد التقرير التجريبي مع النص الخام
      const report = buildDemoReport(brief);
      return NextResponse.json({ report, demo: true, parseFailed: true, raw: text });
    }

    const report: ArchitectReport = {
      ...parsed,
      generatedAt: Date.now(),
      model: MODEL,
    };

    return NextResponse.json({ report, demo: false });
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI_ERROR";
    // عند فشل الاتصال نرجع للوضع التجريبي بدل كسر التطبيق
    const report = buildDemoReport(brief);
    return NextResponse.json({ report, demo: true, error: message });
  }
}

/** يستخرج كائن JSON من نص قد يحوي تنسيق Markdown أو نصاً إضافياً */
function extractJson(text: string): ArchitectReport | null {
  if (!text) return null;
  let cleaned = text.trim();
  // إزالة أسوار الكود ```json ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  // محاولة مباشرة
  try {
    return JSON.parse(cleaned) as ArchitectReport;
  } catch {
    // محاولة التقاط أول { ... } متوازن
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const slice = cleaned.slice(start, end + 1);
      try {
        return JSON.parse(slice) as ArchitectReport;
      } catch {
        return null;
      }
    }
    return null;
  }
}
