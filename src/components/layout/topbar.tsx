"use client";

import { useState } from "react";
import { Menu, Search, Languages, Sun, Moon } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useTheme } from "@/providers/theme-provider";
import { Sidebar } from "./sidebar";

export function Topbar() {
  const { t, locale, toggle } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 glass px-4 lg:px-6">
      <button
        className="grid size-9 place-items-center rounded-md border border-border lg:hidden"
        onClick={() => setOpenMenu(true)}
        aria-label="menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute inset-y-0 my-auto size-4 text-muted-foreground ltr:left-3 rtl:right-3" />
        <input
          placeholder={t.nav.search}
          className="h-9 w-full rounded-md border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-ring ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3"
        />
      </div>

      <div className="ms-auto flex items-center gap-1.5">
        <button
          onClick={toggle}
          className="flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium hover:bg-accent"
          title="Language"
        >
          <Languages className="size-4" />
          {locale === "ar" ? "EN" : "ع"}
        </button>
        <button
          onClick={toggleTheme}
          className="grid size-9 place-items-center rounded-md border border-border hover:bg-accent"
          title="Theme"
          aria-label="theme"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {openMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpenMenu(false)} />
          <div className="absolute inset-y-0 start-0 animate-fade-up">
            <Sidebar onNavigate={() => setOpenMenu(false)} />
          </div>
        </div>
      )}
    </header>
  );
}
