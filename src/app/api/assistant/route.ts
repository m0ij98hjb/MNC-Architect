import { NextRequest, NextResponse } from "next/server";
import type { ProjectBrief, ArchitectReport } from "@/lib/domain/types";
import { MNC_ARCHITECT_SYSTEM_PROMPT } from "@/lib/ai/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * POST /api/assistant
 * body: { messages: ChatMessage[], brief?: ProjectBrief, report?: ArchitectReport }
 *
 * مساعد معماري محادثة يعتمد نفس شخصية وكيل MNC. يستقبل سياق المشروع
 * (البيانات + آخر تقرير) ويرد على طلبات مثل: قلّل التكلفة، زد الشقق، غيّر الطراز.
 * في وضع Demo (بدون مفتاح) يرد برسالة إرشادية ثابتة.
 */
export async function POST(req: NextRequest) {
  let body: { messages?: ChatMessage[]; brief?: ProjectBrief; report?: ArchitectReport };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const messages = body.messages ?? [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "NO_MESSAGES" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    const last = messages[messages.length - 1]?.content ?? "";
    return NextResponse.json({
      reply:
        "وضع تجريبي: المساعد المعماري يعمل بكامل طاقته عند تفعيل مفتاح Anthropic (ANTHROPIC_API_KEY). " +
        `طلبك المسجّل: «${last}». بعد التفعيل سأعيد ضبط الدراسة (التكلفة/الوحدات/الطراز/الواجهة) مع الحفاظ على بيانات المشروع.`,
      demo: true,
    });
  }

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const context = buildContext(body.brief, body.report);
    const system = `${MNC_ARCHITECT_SYSTEM_PROMPT}\n\n${context}\n\nأنت الآن في وضع «مساعد محادثة» داخل مساحة عمل المشروع. أجب بإيجاز عملي بالعربية، وعند طلب تعديل (تقليل تكلفة، زيادة وحدات، تغيير طراز/واجهة، إعادة حساب) اشرح الأثر على الأرقام بوضوح واقترح القيم الجديدة.`;

    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const reply = resp.content
      .filter((b) => b.type === "text")
      .map((b) => ("text" in b ? b.text : ""))
      .join("\n");

    return NextResponse.json({ reply, demo: false });
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI_ERROR";
    return NextResponse.json({ reply: `حدث خطأ في الاتصال بالمساعد: ${message}`, error: message });
  }
}

function buildContext(brief?: ProjectBrief, report?: ArchitectReport): string {
  if (!brief) return "";
  const lines = [
    "=== سياق المشروع الحالي ===",
    `المدينة/الحي: ${brief.city} - ${brief.district}`,
    `مساحة الأرض: ${brief.landArea} م²`,
    `نوع المشروع: ${brief.projectType}`,
    `الطراز: ${brief.designStyle}`,
    brief.floors ? `عدد الأدوار: ${brief.floors}` : "",
    brief.targetUnits ? `الوحدات المستهدفة: ${brief.targetUnits}` : "",
    brief.budget ? `الميزانية: ${brief.budget} ريال` : "",
  ].filter(Boolean);

  if (report) {
    lines.push(
      "=== ملخص آخر تقرير ===",
      `التكلفة الإجمالية: ${report.estimatedCost.total} ريال (${report.estimatedCost.perSqm} ريال/م²)`,
      `الإيراد المتوقع: ${report.expectedRevenue.total} ريال`,
      `صافي الربح: ${report.netProfit} ريال`,
      `ROI: ${report.roi}% | الاسترداد: ${report.paybackYears} سنة`,
    );
  }
  return lines.join("\n");
}
