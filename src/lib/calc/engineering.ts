import type { ArchitectReport, ProjectBrief, DesignStyle } from "@/lib/domain/types";

// ===== أسعار البناء التقريبية داخل السعودية (ريال/م²) =====
export const COST_TIERS = {
  economic: { min: 1600, max: 2000, label: "اقتصادي" },
  medium: { min: 2100, max: 2600, label: "متوسط" },
  luxury: { min: 2700, max: 3500, label: "فاخر" },
} as const;

export type CostTier = keyof typeof COST_TIERS;

export function tierForStyle(style: DesignStyle): CostTier {
  if (style === "economic") return "economic";
  if (style === "modern_luxury" || style === "neoclassic") return "luxury";
  return "medium";
}

export function midRate(tier: CostTier) {
  const t = COST_TIERS[tier];
  return Math.round((t.min + t.max) / 2);
}

// ===== حساب التكلفة =====
export function estimateCost(builtUpArea: number, tier: CostTier) {
  const perSqm = midRate(tier);
  return { perSqm, total: Math.round(perSqm * builtUpArea), tier };
}

// ===== حساب المواقف =====
export interface ParkingInput {
  projectType: ProjectBrief["projectType"];
  units?: number;
  commercialArea?: number; // م² للتجاري
}
export function calcParking({ projectType, units = 0, commercialArea = 0 }: ParkingInput) {
  let residential = 0;
  let commercial = 0;
  if (projectType === "commercial") {
    commercial = Math.ceil(commercialArea / 25); // موقف لكل 25م²
  } else if (projectType === "mixed_use") {
    residential = Math.ceil(units * 1.25);
    commercial = Math.ceil(commercialArea / 25);
  } else {
    // سكني: ~1.25 موقف للوحدة بشكل واقعي
    residential = Math.ceil(units * 1.25);
  }
  return { residential, commercial, total: residential + commercial };
}

// ===== حساب العائد الاستثماري =====
export interface RoiInput {
  totalCost: number;
  landCost?: number;
  expectedRevenue: number;
}
export function calcRoi({ totalCost, landCost = 0, expectedRevenue }: RoiInput) {
  const investment = totalCost + landCost;
  const netProfit = expectedRevenue - investment;
  const roi = investment > 0 ? (netProfit / investment) * 100 : 0;
  // فترة استرداد تقديرية على أساس ربح موزّع على 12-18 شهر للبيع
  const paybackYears = netProfit > 0 ? +(investment / (netProfit / 1.5 + investment / 1.5)).toFixed(1) : 0;
  return {
    investment,
    netProfit: Math.round(netProfit),
    roi: +roi.toFixed(1),
    paybackYears: paybackYears || 1.5,
  };
}

/**
 * ===== Demo report builder =====
 * يُستخدم عندما لا يوجد ANTHROPIC_API_KEY، ليبقى التطبيق قابلاً للتشغيل فوراً.
 * يبني تقريراً واقعياً من المعادلات أعلاه دون أي AI.
 */
export function buildDemoReport(brief: ProjectBrief): ArchitectReport {
  const tier = tierForStyle(brief.designStyle);
  const ratio = (brief.buildingRatio ?? 60) / 100;
  const floors = brief.floors ?? 4;
  const footprint = Math.round(brief.landArea * ratio);
  const builtUp = footprint * floors;
  const cost = estimateCost(builtUp, tier);
  const units = brief.targetUnits ?? Math.max(4, Math.round(builtUp / 140));
  const parking = calcParking({ projectType: brief.projectType, units, commercialArea: footprint });

  // افتراض سعر بيع للمتر بناءً على الشريحة
  const sellPerSqm = tier === "luxury" ? 5200 : tier === "medium" ? 4200 : 3400;
  const sellableArea = Math.round(builtUp * 0.82); // كفاءة المساحات
  const revenue = sellableArea * sellPerSqm;
  const landCost = brief.budget ? Math.round(brief.budget * 0.35) : Math.round(brief.landArea * 3500);
  const roi = calcRoi({ totalCost: cost.total, landCost, expectedRevenue: revenue });

  return {
    generatedAt: Date.now(),
    model: "demo-mode",
    summary: `مشروع ${typeAr(brief.projectType)} في ${brief.district}، ${brief.city} على أرض مساحتها ${brief.landArea} م². الطراز ${COST_TIERS[tier].label} بإجمالي مسطحات بناء تقديري ${builtUp.toLocaleString()} م² موزعة على ${floors} أدوار، باستهداف ${units} وحدة. (تقرير تجريبي مولّد بالمعادلات — فعّل مفتاح Anthropic للحصول على تحليل المهندس الاستشاري الكامل.)`,
    assumptions: [
      `نسبة بناء مفترضة ${(ratio * 100).toFixed(0)}% (في حال عدم تحديدها).`,
      `عدد أدوار ${floors} ومسطح دور ${footprint.toLocaleString()} م².`,
      `سعر بناء ${cost.perSqm.toLocaleString()} ريال/م² (شريحة ${COST_TIERS[tier].label}).`,
      `كفاءة مساحات بيع 82% وسعر بيع ${sellPerSqm.toLocaleString()} ريال/م².`,
    ],
    siteAnalysis: `أرض ${brief.dimensions ?? "بأبعاد منتظمة"} باتجاه شارع ${brief.streetDirection ?? "غير محدد"} وعرض ${brief.streetWidth ?? 20}م. الموقع مناسب لمدخل فاخر بواجهة معمارية واضحة، مع إمكانية الاستفادة من ${brief.streetsCount ?? 1} واجهة/واجهات للإضاءة والتهوية.`,
    bestConcept: `الفكرة الأنسب: مبنى ${typeAr(brief.projectType)} بطابع Modern Luxury، واجهة ترافرتين وزجاج رمادي عاكس ولوفرات ألمنيوم، مع لوبي مدخل مزدوج الارتفاع وتوزيع داخلي يقلّل الهدر ويرفع نسبة المساحات القابلة للبيع.`,
    options: [
      { title: "اقتصادي", description: "تشطيب جيد بتكلفة منضبطة وأعلى كثافة وحدات.", units: Math.round(units * 1.15), builtUpArea: builtUp, highlights: ["أقل تكلفة/م²", "أسرع تنفيذ", "كثافة وحدات أعلى"] },
      { title: "مودرن فاخر", description: "واجهات حجر طبيعي وزجاج عاكس وتفاصيل إضاءة معمارية ومداخل فاخرة.", units, builtUpArea: builtUp, highlights: ["أعلى قيمة بيعية", "هوية MNC", "تشطيب متميز"] },
      { title: "أعلى عائد استثماري", description: "توازن بين الكثافة والتشطيب لتعظيم صافي الربح وفترة الاسترداد.", units: Math.round(units * 1.08), builtUpArea: builtUp, highlights: ["أفضل ROI", "مزيج وحدات مرن", "كفاءة مساحات"] },
    ],
    areaTable: [
      { label: "مسطح الدور الأرضي", area: footprint, count: 1, notes: "مدخل + مواقف/محلات" },
      { label: "الأدوار المتكررة", area: footprint, count: Math.max(1, floors - 1), notes: `${units} وحدة` },
      { label: "السطح", area: Math.round(footprint * 0.4), count: 1, notes: "خدمات + غرفة درج/مصعد" },
      { label: "إجمالي مسطحات البناء", area: builtUp, notes: "" },
    ],
    planDescription: {
      site: `توزيع الكتلة مع ارتداد ${brief.setbacks ?? "نظامي"} ومدخل رئيسي على الشارع ${brief.streetDirection ?? "الرئيسي"}.`,
      groundFloor: `مدخل فاخر + ${parking.commercial > 0 ? `${parking.commercial} موقف/محلات تجارية` : "مواقف"} ولوبي وخدمات.`,
      typicalFloors: `${Math.max(1, floors - 1)} أدوار متكررة تضم ${units} وحدة بمساحات متنوعة.`,
      roof: "خزانات، غرفة مصاعد، ومساحة خدمات اختيارية.",
      parking: `إجمالي ${parking.total} موقف (سكني ${parking.residential} + تجاري ${parking.commercial}).`,
    },
    facade: "ترافرتين/حجر طبيعي + زجاج رمادي عاكس + لوفرات ألمنيوم سوداء أو فضية + إضاءة معمارية مخفية تبرز خطوط المبنى ليلاً.",
    estimatedCost: { perSqm: cost.perSqm, totalBuiltUp: builtUp, total: cost.total, note: `شريحة ${COST_TIERS[tier].label}` },
    expectedRevenue: { total: revenue, note: `${sellableArea.toLocaleString()} م² قابلة للبيع × ${sellPerSqm.toLocaleString()} ريال/م²` },
    netProfit: roi.netProfit,
    roi: roi.roi,
    paybackYears: roi.paybackYears,
    valueEngineering: [
      "توحيد شبكة الأعمدة لتقليل كميات الخرسانة والحديد.",
      "اختيار خامات واجهة محلية معادلة جمالياً لتقليل التكلفة.",
      "تحسين مزيج الوحدات لرفع نسبة المساحات القابلة للبيع.",
    ],
    imagePrompt: `Ultra-realistic architectural render of a modern luxury ${enType(brief.projectType)} in ${brief.city}, Saudi Arabia. Travertine and natural stone facade, reflective grey glass, black aluminum louvers, dramatic architectural lighting, grand double-height entrance, dusk lighting, ${floors} floors, photorealistic, 8k, wide angle.`,
    recommendation: `نوصي باعتماد خيار «${roi.roi >= 20 ? "أعلى عائد استثماري" : "مودرن فاخر"}» لتحقيق ROI تقديري ${roi.roi}% وفترة استرداد ~${roi.paybackYears} سنة، مع تثبيت هوية MNC في الواجهات والمدخل.`,
  };
}

function typeAr(t: ProjectBrief["projectType"]) {
  return ({
    residential_apartments: "عمارة سكنية",
    villa: "فيلا",
    residential_complex: "مجمع سكني",
    commercial: "مبنى تجاري",
    mixed_use: "مبنى متعدد الاستخدام",
    office: "مبنى إداري",
  } as const)[t];
}
function enType(t: ProjectBrief["projectType"]) {
  return ({
    residential_apartments: "residential apartment building",
    villa: "villa",
    residential_complex: "residential complex",
    commercial: "commercial building",
    mixed_use: "mixed-use building",
    office: "office building",
  } as const)[t];
}
