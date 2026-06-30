import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1320px" } },
    extend: {
      colors: {
        // ===== MNC core palette (Navy + Gold + Travertine) =====
        navy: {
          950: "#06121F",
          900: "#081726",
          800: "#0C2138",
          700: "#102A45",
          600: "#163554",
        },
        gold: {
          DEFAULT: "#C9A24B",
          light: "#E2C879",
          deep: "#9C7A30",
          muted: "#B8985A",
        },
        travertine: {
          DEFAULT: "#F1EBDD",
          soft: "#FBF7EF",
          deep: "#E6DCC6",
        },
        // semantic (driven by CSS vars so dark/light both work)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        sans: ["var(--font-arabic)", "var(--font-latin)", "system-ui", "sans-serif"],
        latin: ["var(--font-latin)", "system-ui", "sans-serif"],
        display: ["var(--font-latin)", "var(--font-arabic)", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      boxShadow: {
        luxe: "0 2px 6px rgba(6,18,31,.06), 0 18px 40px -18px rgba(6,18,31,.35)",
        gold: "0 0 0 1px rgba(201,162,75,.35), 0 10px 30px -12px rgba(201,162,75,.45)",
        inset: "inset 0 1px 0 0 rgba(255,255,255,.06)",
      },
      backgroundImage: {
        "gold-line": "linear-gradient(90deg, transparent, #C9A24B 18%, #E2C879 50%, #C9A24B 82%, transparent)",
        "navy-fade": "linear-gradient(180deg, #0C2138 0%, #081726 100%)",
        blueprint:
          "linear-gradient(rgba(201,162,75,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,75,.05) 1px, transparent 1px)",
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "scan": { "0%": { top: "0%" }, "100%": { top: "100%" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "fade-up": "fade-up .5s cubic-bezier(.16,1,.3,1) both",
        scan: "scan 2.4s ease-in-out infinite alternate",
        shimmer: "shimmer 1.8s infinite",
      },
    },
  },
  plugins: [tailwindAnimate],
};

export default config;
