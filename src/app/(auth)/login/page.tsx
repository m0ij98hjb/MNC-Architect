"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/lib/i18n/provider";
import { FIREBASE_ENABLED } from "@/lib/firebase/client";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ROLES, ROLE_LABELS } from "@/lib/rbac/permissions";
import type { Role } from "@/lib/domain/types";

export default function LoginPage() {
  const { signIn, user } = useAuth();
  const { t, locale } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("eng@mnc.sa");
  const [password, setPassword] = useState("demo1234");
  const [role, setRole] = useState<Role>("super_admin");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  const onSubmit = async () => {
    if (!email) return toast.error(t.form.required);
    setLoading(true);
    try {
      await signIn(email, password, role);
      toast.success("تم تسجيل الدخول");
      router.replace("/dashboard");
    } catch (e) {
      toast.error((e as Error).message || "خطأ في تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-navy-fade lg:block">
        <div className="absolute inset-0 blueprint-bg opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-12 text-travertine">
          <Logo />
          <div className="max-w-md space-y-5">
            <div className="eyebrow text-gold-light">MNC GROUP · JEDDAH</div>
            <h1 className="font-display text-4xl font-bold leading-tight text-travertine">
              من بيانات الأرض إلى تصور معماري متكامل خلال دقائق
            </h1>
            <p className="text-travertine/70">
              تحليل الموقع، أفضل استغلال، الكتل، الواجهات، المواقف، التكلفة، والعائد الاستثماري — بأسلوب
              <span className="text-gold-light"> Modern Luxury </span>
              المعتمد لدى MNC.
            </p>
            <div className="flex gap-6 pt-4">
              {[
                { k: "16", v: "قسم في التقرير" },
                { k: "13", v: "أداة ذكية" },
                { k: "8", v: "أدوار صلاحيات" },
              ].map((s) => (
                <div key={s.v}>
                  <div className="tnum text-3xl font-bold text-gold-light">{s.k}</div>
                  <div className="text-xs text-travertine/60">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-travertine/40">© {new Date().getFullYear()} MNC Architect AI Platform</div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <div className="eyebrow mb-2">{t.auth.title}</div>
          <h2 className="mb-1 text-2xl font-bold">{t.auth.title}</h2>
          <p className="mb-7 text-sm text-muted-foreground">{t.auth.subtitle}</p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">{t.auth.email}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
            </div>
            <div>
              <Label htmlFor="password">{t.auth.password}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
            </div>

            {!FIREBASE_ENABLED && (
              <div>
                <Label htmlFor="role">{t.auth.role}</Label>
                <Select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r][locale]}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <Button className="w-full" size="lg" onClick={onSubmit} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowLeft className="size-4 flip-on-rtl" />}
              {t.auth.signin}
            </Button>

            {!FIREBASE_ENABLED && (
              <p className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-center text-xs text-muted-foreground">
                {t.auth.demoHint}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
