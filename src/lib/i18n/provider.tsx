"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import ar, { type Dict } from "@/lib/i18n/dictionaries/ar";
import en from "@/lib/i18n/dictionaries/en";
import { type Locale, dir, defaultLocale } from "@/lib/i18n/config";

const DICTS: Record<Locale, Dict> = { ar, en };

interface I18nCtx {
  locale: Locale;
  t: Dict;
  dir: "rtl" | "ltr";
  setLocale: (l: Locale) => void;
  toggle: () => void;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("mnc_locale")) as Locale | null;
    if (saved && (saved === "ar" || saved === "en")) setLocaleState(saved);
  }, []);

  useEffect(() => {
    const d = dir(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = d;
    if (typeof window !== "undefined") localStorage.setItem("mnc_locale", locale);
  }, [locale]);

  const setLocale = (l: Locale) => setLocaleState(l);
  const toggle = () => setLocaleState((p) => (p === "ar" ? "en" : "ar"));

  return (
    <Ctx.Provider value={{ locale, t: DICTS[locale], dir: dir(locale), setLocale, toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
