import type { ProjectBrief } from "@/lib/domain/types";

/**
 * ===== MNC Architect AI Agent — System Prompt =====
 * هذا هو الـ persona المعتمد لشركة MNC. لا تغيّره دون مراجعة الإدارة الهندسية.
 * يُستخدم في: /api/architect (مولّد التقرير) و /api/assistant (المساعد داخل المشروع).
 */
export const MNC_ARCHITECT_SYSTEM_PROMPT = `اسمك MNC Architect AI Agent.
أنت مهندس معماري استشاري سعودي محترف، تعمل لصالح MNC Group، ومتخصص في تصميم المباني السكنية والاستثمارية داخل المملكة العربية السعودية.
مهمتك تحويل بيانات أي أرض إلى تصور معماري متكامل يشمل: تحليل الموقع، أفضل استغلال للأرض، توزيع الكتل، المخططات الأولية، الواجهات، المواقف، التكلفة، العائد الاستثماري، وبرومبتات الصور الواقعية.

اعتمد أسعار السعودية التقريبية:
- اقتصادي: 1600–2000 ريال/م².
- متوسط: 2100–2600 ريال/م².
- فاخر: 2700–3500 ريال/م².
في المباني السكنية احسب المواقف بواقعية، وفي التجاري استخدم موقف لكل 25م² عند الحاجة.

أسلوب التصميم المفضل لـ MNC: Modern Luxury — واجهات ترافرتين أو حجر طبيعي، زجاج رمادي عاكس، لوفرات ألمنيوم سوداء أو فضية، إضاءة معمارية راقية، مدخل فاخر، توزيع عملي قابل للتنفيذ، تقليل الهدر وزيادة العائد.

إذا كانت البيانات ناقصة لا تتوقف؛ ضع افتراضات منطقية واذكرها بوضوح.
اكتب بالعربية بأسلوب مهندس استشاري محترف وواضح، وقدّم نتائج عملية قابلة للاستخدام في العروض والمناقشات مع العملاء.`;

/**
 * تعليمات الإخراج المنظّم (JSON) — تُلحق برسالة المستخدم في /api/architect.
 * المفاتيح تطابق واجهة ArchitectReport بالضبط.
 */
export const STRUCTURED_OUTPUT_INSTRUCTION = `
أعد ردك **حصراً** ككائن JSON صالح واحد بدون أي نص قبله أو بعده وبدون علامات Markdown، بالمخطط التالي (كل النصوص بالعربية):
{
  "summary": "ملخص المشروع - فقرة",
  "assumptions": ["افتراض 1", "افتراض 2"],
  "siteAnalysis": "تحليل الأرض - فقرة",
  "bestConcept": "أفضل فكرة تصميمية - فقرة",
  "options": [
    {"title":"اقتصادي","description":"...","units":0,"builtUpArea":0,"highlights":["..."]},
    {"title":"مودرن فاخر","description":"...","units":0,"builtUpArea":0,"highlights":["..."]},
    {"title":"أعلى عائد استثماري","description":"...","units":0,"builtUpArea":0,"highlights":["..."]}
  ],
  "areaTable": [{"label":"الدور الأرضي","area":0,"count":1,"notes":""}],
  "planDescription": {"site":"الموقع العام","groundFloor":"الدور الأرضي","typicalFloors":"الأدوار المتكررة","roof":"السطح","parking":"المواقف"},
  "facade": "فكرة الواجهات والمواد",
  "estimatedCost": {"perSqm":2400,"totalBuiltUp":0,"total":0,"note":""},
  "expectedRevenue": {"total":0,"note":""},
  "netProfit": 0,
  "roi": 0,
  "paybackYears": 0,
  "valueEngineering": ["اقتراح 1","اقتراح 2"],
  "imagePrompt": "برومبت إنجليزي احترافي لصورة واقعية للمشروع لمحرك توليد صور",
  "recommendation": "التوصية النهائية"
}
الأرقام أرقام فعلية (وليست نصوص). estimatedCost.total = perSqm * totalBuiltUp. roi نسبة مئوية. paybackYears بالسنوات.`;

/** يبني رسالة المستخدم من بيانات الأرض */
export function buildArchitectUserMessage(brief: ProjectBrief, extra?: string): string {
  const f = (label: string, v: unknown) =>
    v === undefined || v === null || v === "" ? "" : `- ${label}: ${v}\n`;

  const styleMap: Record<string, string> = {
    economic: "اقتصادي",
    modern_luxury: "مودرن فاخر (Modern Luxury)",
    neoclassic: "نيوكلاسيك",
    contemporary: "معاصر",
    max_roi: "أعلى عائد استثماري",
  };
  const typeMap: Record<string, string> = {
    residential_apartments: "عمارة سكنية (شقق)",
    villa: "فيلا",
    residential_complex: "مجمع سكني",
    commercial: "تجاري",
    mixed_use: "متعدد الاستخدام",
    office: "إداري/مكاتب",
  };

  return `حوّل بيانات الأرض التالية إلى تصور معماري متكامل وفق الأقسام الـ16 المعتمدة:

${f("المدينة", brief.city)}${f("الحي", brief.district)}${f("رقم القطعة", brief.plotNumber)}${f("مساحة الأرض (م²)", brief.landArea)}${f("الأبعاد", brief.dimensions)}${f("عرض الشارع (م)", brief.streetWidth)}${f("اتجاه الشارع", brief.streetDirection)}${f("عدد الشوارع", brief.streetsCount)}${f("نسبة البناء (%)", brief.buildingRatio)}${f("الارتدادات", brief.setbacks)}${f("عدد الأدوار", brief.floors)}${f("نوع المشروع", typeMap[brief.projectType] ?? brief.projectType)}${f("عدد الوحدات المستهدف", brief.targetUnits)}${f("الميزانية (ريال)", brief.budget)}${f("الطراز المطلوب", styleMap[brief.designStyle] ?? brief.designStyle)}${f("ملاحظات", brief.notes)}
${extra ? `\nتعليمات إضافية من المستخدم: ${extra}\n` : ""}
${STRUCTURED_OUTPUT_INSTRUCTION}`;
}
