"use client";

import { Settings, Database, KeyRound, Globe, Palette, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/providers/auth-provider";
import { ROLE_LABELS } from "@/lib/rbac/permissions";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();

  const rows: Array<{ icon: React.ElementType; label: string; value: string; ok?: boolean }> = [
    { icon: Database, label: "قاعدة البيانات", value: "Firestore (يعمل تلقائياً عند ضبط متغيرات Firebase)", ok: false },
    { icon: KeyRound, label: "محرك الذكاء الاصطناعي", value: "Anthropic Claude (يُفعّل بمفتاح ANTHROPIC_API_KEY)", ok: false },
    { icon: Globe, label: "اللغات", value: "العربية (RTL) + English (LTR)", ok: true },
    { icon: Palette, label: "الثيم", value: "MNC Navy & Gold · داكن/فاتح", ok: true },
    { icon: ShieldCheck, label: "نظام الصلاحيات", value: "RBAC — 8 أدوار", ok: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="eyebrow mb-1">MNC · SETTINGS</div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Settings className="size-6 text-primary" /> {t.nav.settings}
        </h1>
      </div>

      <div className="mnc-card p-5">
        <h3 className="mb-4 font-semibold">حالة النظام</h3>
        <div className="space-y-2.5">
          {rows.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.label} className="flex items-center gap-3 rounded-xl border border-border bg-card/40 px-3 py-3">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{r.label}</div>
                  <div className="text-xs text-muted-foreground">{r.value}</div>
                </div>
                <Badge variant={r.ok ? "success" : "muted"}>{r.ok ? "مُفعّل" : "اختياري"}</Badge>
              </div>
            );
          })}
        </div>
        <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
          المنصة تعمل بالكامل في الوضع التجريبي بدون أي مفاتيح. لتفعيل الحفظ السحابي والتحليل الكامل، انسخ
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5">.env.example</code> إلى
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5">.env.local</code> واضبط المتغيرات.
        </p>
      </div>

      {user && (
        <div className="mnc-card p-5">
          <h3 className="mb-3 font-semibold">الحساب الحالي</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{user.email}</span>
            <Badge>{ROLE_LABELS[user.role][locale]}</Badge>
          </div>
        </div>
      )}
    </div>
  );
}
