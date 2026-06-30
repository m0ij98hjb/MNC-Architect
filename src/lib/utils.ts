import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Saudi Riyal formatter */
export function sar(n: number | null | undefined, opts: { compact?: boolean } = {}) {
  if (n == null || Number.isNaN(n)) return "—";
  const fmt = new Intl.NumberFormat("en-US", {
    notation: opts.compact ? "compact" : "standard",
    maximumFractionDigits: opts.compact ? 1 : 0,
  });
  return `${fmt.format(n)} ﷼`;
}

export function num(n: number | null | undefined, frac = 0) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: frac }).format(n);
}

export function pct(n: number | null | undefined, frac = 1) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: frac }).format(n)}%`;
}

export function formatDate(d: Date | number | string, locale: "ar" | "en" = "ar") {
  const date = new Date(d);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}
