import type { Role } from "@/lib/domain/types";

export const ROLES: Role[] = [
  "super_admin",
  "engineering_manager",
  "architect",
  "structural_engineer",
  "interior_designer",
  "cost_engineer",
  "sales",
  "viewer",
];

export const ROLE_LABELS: Record<Role, { ar: string; en: string }> = {
  super_admin: { ar: "مدير النظام", en: "Super Admin" },
  engineering_manager: { ar: "مدير هندسي", en: "Engineering Manager" },
  architect: { ar: "معماري", en: "Architect" },
  structural_engineer: { ar: "مهندس إنشائي", en: "Structural Engineer" },
  interior_designer: { ar: "مصمم داخلي", en: "Interior Designer" },
  cost_engineer: { ar: "مهندس تكاليف", en: "Cost Engineer" },
  sales: { ar: "مبيعات", en: "Sales" },
  viewer: { ar: "مشاهد", en: "Viewer" },
};

/** Granular permissions used across pages AND apis */
export type Permission =
  | "project.view"
  | "project.create"
  | "project.edit"
  | "project.delete"
  | "ai.run"
  | "cost.view"
  | "report.export"
  | "users.manage"
  | "settings.manage";

const ALL: Permission[] = [
  "project.view",
  "project.create",
  "project.edit",
  "project.delete",
  "ai.run",
  "cost.view",
  "report.export",
  "users.manage",
  "settings.manage",
];

export const PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ALL,
  engineering_manager: [
    "project.view",
    "project.create",
    "project.edit",
    "project.delete",
    "ai.run",
    "cost.view",
    "report.export",
  ],
  architect: ["project.view", "project.create", "project.edit", "ai.run", "report.export"],
  structural_engineer: ["project.view", "project.edit", "ai.run", "report.export"],
  interior_designer: ["project.view", "project.edit", "ai.run", "report.export"],
  cost_engineer: ["project.view", "cost.view", "ai.run", "report.export"],
  sales: ["project.view", "report.export"],
  viewer: ["project.view"],
};

export function can(role: Role | undefined, perm: Permission): boolean {
  if (!role) return false;
  return PERMISSIONS[role]?.includes(perm) ?? false;
}

/** Throws on the server when a role lacks a permission */
export function assertCan(role: Role | undefined, perm: Permission) {
  if (!can(role, perm)) {
    const e = new Error(`Forbidden: missing permission "${perm}"`);
    (e as Error & { status?: number }).status = 403;
    throw e;
  }
}
