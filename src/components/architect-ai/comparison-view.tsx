"use client";

import { TrendingUp, CheckCircle2 } from "lucide-react";
import type { ProjectBrief, ArchitectReport, DesignOption } from "@/lib/domain/types";
import { useI18n } from "@/lib/i18n/provider";
import { sar, num } from "@/lib/utils";
import { cn } from "@/lib/utils";

function calcOptionFinancials(
  opt: DesignOption,
  report: ArchitectReport,
  factor: { cost: number; rev: number },
) {
  const builtUp = opt.builtUpArea ?? report.estimatedCost.totalBuiltUp;
  const cost = Math.round(builtUp * report.estimatedCost.perSqm * factor.cost);
  const revenue = Math.round(report.expectedRevenue.total * factor.rev);
  const profit = revenue - cost;
  const roi = cost > 0 ? Math.round((profit / cost) * 100) : 0;
  const payback = roi > 0 ? +(cost / (profit / report.paybackYears)).toFixed(1) : report.paybackYears;
  return { builtUp, cost, revenue, profit, roi, payback };
}

const FACTORS: Array<{ cost: number; rev: number }> = [
  { cost: 0.82, rev: 0.78 },  // economic
  { cost: 1.0,  rev: 1.0  },  // modern luxury
  { cost: 1.12, rev: 1.32 },  // investment
];

export function ComparisonView({ brief, report }: { brief: ProjectBrief; report: ArchitectReport }) {
  const { t, locale } = useI18n();
  const cmp = t.architectAi.comparison;
  const opts = report.options.slice(0, 3);
  const financials = opts.map((o, i) => calcOptionFinancials(o, report, FACTORS[i]));

  // Find best per row
  const bestRoi    = financials.reduce((best, f, i) => f.roi > financials[best].roi ? i : best, 0);
  const bestProfit = financials.reduce((best, f, i) => f.profit > financials[best].profit ? i : best, 0);
  const bestCost   = financials.reduce((best, f, i) => f.cost < financials[best].cost ? i : best, 0);
  const bestUnits  = opts.reduce((best, o, i) => (o.units ?? 0) > (opts[best].units ?? 0) ? i : best, 0);

  const colAccent = ["text-emerald-500 border-emerald-500/20 bg-emerald-500/5",
                     "text-primary border-primary/20 bg-primary/5",
                     "text-violet-500 border-violet-500/20 bg-violet-500/5"];

  return (
    <div className="space-y-5">
      {/* Header cards */}
      <div className="grid grid-cols-3 gap-3">
        {opts.map((opt, i) => (
          <div key={i} className={cn("rounded-xl border p-4 text-center", colAccent[i])}>
            <div className="mb-1 font-semibold">{opt.title}</div>
            <p className="text-xs text-muted-foreground line-clamp-2">{opt.description}</p>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="mnc-card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground">{cmp.metric}</th>
              {opts.map((opt, i) => (
                <th key={i} className="px-4 py-3 text-center text-xs font-semibold">
                  <span className={cn("rounded-full px-2 py-0.5", colAccent[i].split(" ").slice(0, 2).join(" "))}>
                    {cmp.option_labels[i]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {[
              { label: cmp.built_area, values: financials.map(f => `${num(f.builtUp)} م²`), best: null },
              { label: cmp.units, values: opts.map(o => `${o.units ?? "—"} وحدة`), best: bestUnits },
              { label: cmp.cost, values: financials.map(f => sar(f.cost)), best: bestCost },
              { label: cmp.revenue, values: financials.map(f => sar(f.revenue)), best: null },
              { label: cmp.profit, values: financials.map(f => sar(f.profit)), best: bestProfit },
              { label: cmp.roi, values: financials.map(f => `${f.roi}%`), best: bestRoi },
              { label: cmp.payback, values: financials.map(f => `${f.payback} ${locale === "ar" ? "سنة" : "yrs"}`), best: null },
            ].map((row) => (
              <tr key={row.label} className="hover:bg-accent/30 transition-colors">
                <td className="px-4 py-3 text-xs font-medium text-muted-foreground">{row.label}</td>
                {row.values.map((v, i) => (
                  <td key={i} className="px-4 py-3 text-center">
                    <span className={cn(
                      "inline-flex items-center gap-1 tnum font-semibold",
                      row.best === i ? colAccent[i].split(" ")[0] : "text-foreground"
                    )}>
                      {v}
                      {row.best === i && <TrendingUp className="size-3" />}
                    </span>
                  </td>
                ))}
              </tr>
            ))}

            {/* Highlights */}
            <tr className="hover:bg-accent/30 transition-colors">
              <td className="px-4 py-3 text-xs font-medium text-muted-foreground align-top">{cmp.highlights}</td>
              {opts.map((opt, i) => (
                <td key={i} className="px-4 py-3 align-top">
                  <ul className="space-y-1">
                    {(opt.highlights ?? []).slice(0, 3).map((h, j) => (
                      <li key={j} className="flex items-start gap-1 text-[11px] text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-primary" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ROI Bar Chart */}
      <div className="mnc-card p-5">
        <h4 className="mb-4 text-sm font-semibold">
          {locale === "ar" ? "مقارنة العائد الاستثماري" : "ROI Comparison"}
        </h4>
        <div className="space-y-3">
          {opts.map((opt, i) => {
            const f = financials[i];
            const maxRoi = Math.max(...financials.map(x => x.roi));
            const pct = maxRoi > 0 ? (f.roi / maxRoi) * 100 : 0;
            const barColors = ["bg-emerald-500", "bg-primary", "bg-violet-500"];
            return (
              <div key={i}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{opt.title}</span>
                  <span className={cn("tnum font-bold", colAccent[i].split(" ")[0])}>{f.roi}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full transition-all", barColors[i])} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendation */}
      {report.recommendation && (
        <div className="mnc-card border-primary/30 bg-primary/5 p-5">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="size-4 text-primary" />
            {locale === "ar" ? "التوصية النهائية" : "Final Recommendation"}
          </h4>
          <p className="text-sm leading-relaxed">{report.recommendation}</p>
        </div>
      )}
    </div>
  );
}
