import type { LucideIcon } from "lucide-react";
import {
  Map,
  Maximize,
  Lightbulb,
  LayoutGrid,
  Building,
  PanelTop,
  Layers3,
  Car,
  Calculator,
  TrendingUp,
  Scissors,
  ImageIcon,
  FileText,
} from "lucide-react";

export type ToolKind = "report" | "calculator" | "ai";

export interface ToolDef {
  id: string;
  /** key in dictionary tools.* */
  i18nKey: string;
  icon: LucideIcon;
  kind: ToolKind;
  /** أدوات جاهزة تعمل فوراً (تقرير/حاسبات) أو مجهّزة بنقطة ربط AI */
  ready: boolean;
}

/**
 * سجل الأدوات الـ13. التقرير والحاسبات (تكلفة/عائد/مواقف) تعمل فوراً.
 * باقي الأدوات مجهّزة بنقطة ربط AI (// AI HOOK) ضمن واجهة موحّدة،
 * بحيث يمكن توصيلها لاحقاً بنفس مسار /api/architect دون إعادة هيكلة.
 */
export const TOOLS: ToolDef[] = [
  { id: "report", i18nKey: "report", icon: FileText, kind: "report", ready: true },
  { id: "cost", i18nKey: "cost", icon: Calculator, kind: "calculator", ready: true },
  { id: "roi", i18nKey: "roi", icon: TrendingUp, kind: "calculator", ready: true },
  { id: "parking", i18nKey: "parking", icon: Car, kind: "calculator", ready: true },
  { id: "site_analyzer", i18nKey: "site_analyzer", icon: Map, kind: "ai", ready: false },
  { id: "land_utilization", i18nKey: "land_utilization", icon: Maximize, kind: "ai", ready: false },
  { id: "concept_generator", i18nKey: "concept_generator", icon: Lightbulb, kind: "ai", ready: false },
  { id: "space_planner", i18nKey: "space_planner", icon: LayoutGrid, kind: "ai", ready: false },
  { id: "floor_plan", i18nKey: "floor_plan", icon: Layers3, kind: "ai", ready: false },
  { id: "facade", i18nKey: "facade", icon: Building, kind: "ai", ready: false },
  { id: "materials", i18nKey: "materials", icon: PanelTop, kind: "ai", ready: false },
  { id: "value_eng", i18nKey: "value_eng", icon: Scissors, kind: "ai", ready: false },
  { id: "image_prompt", i18nKey: "image_prompt", icon: ImageIcon, kind: "ai", ready: false },
];
