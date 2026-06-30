"use client";

import { UserCircle, Mail, BadgeCheck, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/providers/auth-provider";
import { ROLE_LABELS, PERMISSIONS } from "@/lib/rbac/permissions";
import { Badge } from "@/components/ui/badge";

const PERM_LABELS: Record<string, string> = {
  "project.view": "عرض المشاريع",
  "project.create": "إنشاء مشاريع",
  "project.edit": "تعديل المشاريع",
  "project.delete": "حذف المشاريع",
  "ai.run": "تشغيل الذكاء الاصطناعي",
  "cost.view": "عرض التكاليف",
  "report.export": "تصدير التقارير",
  "users.manage": "إدارة المستخدمين",
  "settings.manage": "إدارة الإعدادات",
};

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  if (!user) return null;

  const perms = PERMISSIONS[user.role] ?? [];
  const initials = (user.displayName || user.email).slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <div className="eyebrow mb-1">MNC · PROFILE</div>
        <h1 className="text-2xl font-bold tracking-tight">{t.nav.profile}</h1>
      </div>

      <div className="mnc-card flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-start">
        <div className="grid size-20 place-items-center rounded-2xl bg-navy-fade text-2xl font-bold text-gold-light shadow-gold">
          {initials}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{user.displayName || "مستخدم MNC"}</h2>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground sm:justify-start">
            <span className="flex items-center gap-1.5">
              <Mail className="size-3.5" /> {user.email}
            </span>
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="size-3.5 text-primary" /> {ROLE_LABELS[user.role][locale]}
            </span>
          </div>
        </div>
        <UserCircle className="hidden size-12 text-muted-foreground/30 sm:block" />
      </div>

      <div className="mnc-card p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <ShieldCheck className="size-4 text-primary" /> الصلاحيات
        </h3>
        <div className="flex flex-wrap gap-2">
          {perms.map((p) => (
            <Badge key={p} variant="muted">
              {PERM_LABELS[p] ?? p}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
