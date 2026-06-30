// ===== Roles & RBAC =====
export type Role =
  | "super_admin"
  | "engineering_manager"
  | "architect"
  | "structural_engineer"
  | "interior_designer"
  | "cost_engineer"
  | "sales"
  | "viewer";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  photoURL?: string;
}

// ===== Project domain =====
export type ProjectStatus = "draft" | "active" | "completed" | "archived";

export type ProjectType =
  | "residential_apartments" // عمارة سكنية
  | "villa" // فيلا
  | "residential_complex" // مجمع سكني
  | "commercial" // تجاري
  | "mixed_use" // متعدد الاستخدام
  | "office"; // إداري

export type DesignStyle = "economic" | "modern_luxury" | "neoclassic" | "contemporary" | "max_roi";

/** Raw land/brief inputs that feed the AI Architect Agent */
export interface ProjectBrief {
  city: string;
  district: string;
  plotNumber?: string;
  landArea: number; // م²
  dimensions?: string; // مثال 25x40
  streetWidth?: number; // م
  streetDirection?: string; // شمالي / جنوبي ...
  streetsCount?: number;
  buildingRatio?: number; // % نسبة البناء
  setbacks?: string; // الارتدادات
  floors?: number;
  projectType: ProjectType;
  targetUnits?: number;
  budget?: number; // ريال
  designStyle: DesignStyle;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  brief: ProjectBrief;
  ownerUid: string;
  createdAt: number;
  updatedAt: number;
  /** latest generated architect report, if any */
  report?: ArchitectReport;
  /** audit timeline */
  timeline?: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  at: number;
  userName: string;
  action: string;
  before?: string;
  after?: string;
}

// ===== AI Architect Report (16 sections) =====
export interface DesignOption {
  title: string; // اقتصادي / مودرن فاخر / أعلى عائد
  description: string;
  units?: number;
  builtUpArea?: number;
  highlights?: string[];
}

export interface AreaRow {
  label: string;
  area: number;
  count?: number;
  notes?: string;
}

export interface ArchitectReport {
  generatedAt: number;
  model: string;
  // 1
  summary: string;
  // 2
  assumptions: string[];
  // 3
  siteAnalysis: string;
  // 4
  bestConcept: string;
  // 5
  options: DesignOption[];
  // 6
  areaTable: AreaRow[];
  // 7
  planDescription: {
    site: string;
    groundFloor: string;
    typicalFloors: string;
    roof: string;
    parking: string;
  };
  // 8
  facade: string;
  // 9
  estimatedCost: { perSqm: number; totalBuiltUp: number; total: number; note?: string };
  // 10
  expectedRevenue: { total: number; note?: string };
  // 11
  netProfit: number;
  // 12
  roi: number; // %
  // 13
  paybackYears: number;
  // 14
  valueEngineering: string[];
  // 15
  imagePrompt: string;
  // 16
  recommendation: string;
}
