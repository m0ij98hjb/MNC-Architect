"use client";

import { useState } from "react";
import {
  FileText,
  ListChecks,
  Map,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  Layers3,
  Building,
  Wallet,
  TrendingUp,
  PiggyBank,
  Percent,
  CalendarClock,
  Scissors,
  ImageIcon,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import type { ArchitectReport } from "@/lib/domain/types";
import { useI18n } from "@/lib/i18n/provider";
import { sar, num } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

function Section({
  icon: Icon,
  n,
  title,
  children,
}: {
  icon: React.ElementType;
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mnc-card p-5">
      <header className="mb-3 flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <h3 className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="text-xs text-primary tnum">{String(n).padStart(2, "0")}</span>
          {title}
        </h3>
      </header>
      <div className="text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

function KPI({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 text-center ${accent ? "border-primary/40 bg-primary/5" : "border-border bg-card/50"}`}>
      <div className={`text-lg font-bold tnum ${accent ? "text-gold-gradient" : ""}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export function ReportView({ report }: { report: ArchitectReport }) {
  const { t, locale } = useI18n();
  const r = t.report;
  const [copied, setCopied] = useState(false);

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(report.imagePrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-4">
      {report.model === "demo-mode" && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-xs text-muted-foreground">
          {locale === "ar"
            ? "تقرير تجريبي مولّد بالمعادلات الهندسية. فعّل مفتاح Anthropic للحصول على تحليل المهندس الاستشاري الكامل."
            : "Demo report generated from engineering formulas. Enable the Anthropic key for full consultant analysis."}
        </div>
      )}

      <Section icon={FileText} n={1} title={r.s1}>
        <p>{report.summary}</p>
      </Section>

      <Section icon={ListChecks} n={2} title={r.s2}>
        <ul className="list-disc space-y-1 pe-5">
          {report.assumptions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </Section>

      <Section icon={Map} n={3} title={r.s3}>
        <p>{report.siteAnalysis}</p>
      </Section>

      <Section icon={Sparkles} n={4} title={r.s4}>
        <p>{report.bestConcept}</p>
      </Section>

      <Section icon={LayoutGrid} n={5} title={r.s5}>
        <div className="grid gap-3 sm:grid-cols-3">
          {report.options.map((o, i) => (
            <div key={i} className="rounded-xl border border-border bg-card/50 p-4">
              <div className="mb-1 font-semibold text-primary">{o.title}</div>
              <p className="mb-2 text-xs text-muted-foreground">{o.description}</p>
              {(o.units || o.builtUpArea) && (
                <div className="mb-2 flex flex-wrap gap-2 text-[11px]">
                  {o.units ? <Badge variant="muted">{num(o.units)} وحدة</Badge> : null}
                  {o.builtUpArea ? <Badge variant="muted">{num(o.builtUpArea)} م²</Badge> : null}
                </div>
              )}
              {o.highlights && (
                <ul className="space-y-0.5 text-[11px] text-muted-foreground">
                  {o.highlights.map((h, j) => (
                    <li key={j} className="flex items-center gap-1">
                      <CheckCircle2 className="size-3 text-primary" /> {h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section icon={TableIcon} n={6} title={r.s6}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-start text-xs text-muted-foreground">
                <th className="py-2 text-start font-medium">{r.label}</th>
                <th className="py-2 text-start font-medium">{r.area} (م²)</th>
                <th className="py-2 text-start font-medium">{r.count}</th>
                <th className="py-2 text-start font-medium">{r.notes}</th>
              </tr>
            </thead>
            <tbody>
              {report.areaTable.map((row, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 font-medium">{row.label}</td>
                  <td className="py-2 tnum">{num(row.area)}</td>
                  <td className="py-2 tnum">{row.count ?? "-"}</td>
                  <td className="py-2 text-xs text-muted-foreground">{row.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section icon={Layers3} n={7} title={r.s7}>
        <dl className="space-y-2">
          {[
            ["الموقع العام", report.planDescription.site],
            ["الدور الأرضي", report.planDescription.groundFloor],
            ["الأدوار المتكررة", report.planDescription.typicalFloors],
            ["السطح", report.planDescription.roof],
            ["المواقف", report.planDescription.parking],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5 border-s-2 border-primary/30 ps-3">
              <dt className="text-xs font-semibold text-primary">{k}</dt>
              <dd className="text-sm text-foreground/90">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section icon={Building} n={8} title={r.s8}>
        <p>{report.facade}</p>
      </Section>

      {/* 9-13 KPIs */}
      <Section icon={Wallet} n={9} title={`${r.s9} · ${r.s10} · ${r.s11} · ${r.s12} · ${r.s13}`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <KPI label={r.s9} value={sar(report.estimatedCost.total)} />
          <KPI label={r.s10} value={sar(report.expectedRevenue.total)} />
          <KPI label={r.s11} value={sar(report.netProfit)} accent />
          <KPI label={r.s12} value={`${report.roi}%`} accent />
          <KPI label={r.s13} value={`${report.paybackYears} ${r.years}`} />
        </div>
        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <p className="flex items-center gap-1.5">
            <Wallet className="size-3.5 text-primary" />
            {r.perSqm}: <span className="tnum text-foreground">{sar(report.estimatedCost.perSqm)}</span> ·{" "}
            {num(report.estimatedCost.totalBuiltUp)} م²
          </p>
          {report.expectedRevenue.note && (
            <p className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-primary" /> {report.expectedRevenue.note}
            </p>
          )}
        </div>
      </Section>

      <Section icon={Scissors} n={14} title={r.s14}>
        <ul className="list-disc space-y-1 pe-5">
          {report.valueEngineering.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </ul>
      </Section>

      <Section icon={ImageIcon} n={15} title={r.s15}>
        <div className="rounded-xl bg-navy-900 p-4" dir="ltr">
          <p className="font-mono text-xs leading-relaxed text-gold-light">{report.imagePrompt}</p>
        </div>
        <button
          onClick={copyPrompt}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs transition-colors hover:bg-accent"
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          {copied ? r.copied : r.copyPrompt}
        </button>
      </Section>

      <Section icon={CheckCircle2} n={16} title={r.s16}>
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 font-medium text-foreground">
          {report.recommendation}
        </div>
      </Section>
    </div>
  );
}
