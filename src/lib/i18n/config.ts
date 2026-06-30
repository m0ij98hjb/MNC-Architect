export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";
export const dir = (l: Locale) => (l === "ar" ? "rtl" : "ltr");
