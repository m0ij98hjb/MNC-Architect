"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, Settings, User2, LogOut, BrainCircuit } from "lucide-react";
import { Logo } from "./logo";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/providers/auth-provider";
import { can } from "@/lib/rbac/permissions";
import { ROLE_LABELS } from "@/lib/rbac/permissions";
import { cn } from "@/lib/utils";

export function Sidebar({
  onNavigate,
  variant = "desktop",
}: {
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
}) {
  const { t, locale } = useI18n();
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const isMobile = variant === "mobile";

  const items = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard, show: true },
    { href: "/architect-ai", label: t.architectAi.nav, icon: BrainCircuit, show: true },
    { href: "/projects", label: t.nav.projects, icon: FolderKanban, show: can(user?.role, "project.view") },
    { href: "/settings", label: t.nav.settings, icon: Settings, show: can(user?.role, "settings.manage") },
    { href: "/profile", label: t.nav.profile, icon: User2, show: true },
  ].filter((i) => i.show);

  return (
    <aside
      className={cn(
        "flex h-full flex-col gap-2 border-e border-border",
        isMobile
          ? "w-[280px] max-w-[85vw] overflow-y-auto bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          : "w-[260px] glass dark:border-border/60"
      )}
    >
      <div className={cn("flex items-center gap-2 px-5", isMobile ? "py-6" : "py-5")}>
        <Logo />
      </div>

      <nav className={cn("flex-1 px-3", isMobile ? "space-y-2" : "space-y-1")}>
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href) && item.href !== "/projects/new");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-md text-sm font-medium transition-all",
                isMobile ? "px-4 py-3" : "px-3 py-2.5",
                active ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              {active && <span className="absolute inset-y-1.5 start-0 w-[3px] rounded-full bg-primary" />}
              <Icon className="size-[18px] shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-lg border border-border bg-card/60 p-3">
        <div className="mb-2 flex items-center gap-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {user?.displayName?.[0]?.toUpperCase() ?? "M"}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-medium">{user?.displayName ?? "—"}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {user ? ROLE_LABELS[user.role][locale] : ""}
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-md border border-border text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
            isMobile ? "px-3 py-2.5" : "px-3 py-2"
          )}
        >
          <LogOut className="size-3.5" />
          {t.nav.logout}
        </button>
      </div>
    </aside>
  );
}
