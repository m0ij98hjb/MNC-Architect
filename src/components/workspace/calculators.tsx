"use client";

import { useState } from "react";
import { Calculator, TrendingUp, Car, X } from "lucide-react";
import type { ProjectBrief } from "@/lib/domain/types";
import { estimateCost, tierForStyle, calcParking, calcRoi, COST_TIERS, midRate } from "@/lib/calc/engineering";
import { useI18n } from "@/lib/i18n/provider";
import { sar, num } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Field({ label, value, onChange, suffix }: { label: string; value: number; onChange: (n: number) => void; suffix?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="tnum" />
        {suffix && <span className="pointer-events-none absolute inset-y-0 end-3 grid place-items-center text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function Result({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${accent ? "border-primary/40 bg-primary/5" : "border-border"}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold tnum ${accent ? "text-gold-gradient" : ""}`}>{value}</span>
    </div>
  );
}

function Shell({ title, icon: Icon, onClose, children }: { title: string; icon: React.ElementType; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="mnc-card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <header className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>
            {title}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"><X className="size-4" /></button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function CostCalculator({ brief, onClose }: { brief: ProjectBrief; onClose: () => void }) {
  const { t } = useI18n();
  const tier = tierForStyle(brief.designStyle);
  const ratio = (brief.buildingRatio ?? 60) / 100;
  const [builtUp, setBuiltUp] = useState(Math.round(brief.landArea * ratio * (brief.floors ?? 4)));
  const [rate, setRate] = useState(midRate(tier));
  const total = Math.round(builtUp * rate);

  return (
    <Shell title={t.tools.cost} icon={Calculator} onClose={onClose}>
      <div className="space-y-3">
        <Field label="إجمالي مسطحات البناء" value={builtUp} onChange={setBuiltUp} suffix="م²" />
        <Field label="سعر المتر" value={rate} onChange={setRate} suffix="ريال" />
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {(Object.keys(COST_TIERS) as Array<keyof typeof COST_TIERS>).map((k) => (
            <button key={k} onClick={() => setRate(midRate(k))} className="rounded-full border border-border px-2.5 py-1 text-muted-foreground hover:border-primary/40 hover:text-primary">
              {COST_TIERS[k].label} ({COST_TIERS[k].min}-{COST_TIERS[k].max})
            </button>
          ))}
        </div>
        <Result label="التكلفة الإجمالية" value={sar(total)} accent />
      </div>
    </Shell>
  );
}

export function ParkingCalculator({ brief, onClose }: { brief: ProjectBrief; onClose: () => void }) {
  const { t } = useI18n();
  const ratio = (brief.buildingRatio ?? 60) / 100;
  const footprint = Math.round(brief.landArea * ratio);
  const [units, setUnits] = useState(brief.targetUnits ?? 8);
  const [commercialArea, setCommercialArea] = useState(brief.projectType === "commercial" ? footprint : 0);
  const res = calcParking({ projectType: brief.projectType, units, commercialArea });

  return (
    <Shell title={t.tools.parking} icon={Car} onClose={onClose}>
      <div className="space-y-3">
        <Field label="عدد الوحدات السكنية" value={units} onChange={setUnits} suffix="وحدة" />
        <Field label="المساحة التجارية" value={commercialArea} onChange={setCommercialArea} suffix="م²" />
        <div className="grid grid-cols-3 gap-2">
          <Result label="سكني" value={num(res.residential)} />
          <Result label="تجاري" value={num(res.commercial)} />
          <Result label="الإجمالي" value={num(res.total)} accent />
        </div>
        <p className="text-[11px] text-muted-foreground">سكني ~1.25 موقف/وحدة · تجاري موقف لكل 25م².</p>
      </div>
    </Shell>
  );
}

export function RoiCalculator({ brief, onClose }: { brief: ProjectBrief; onClose: () => void }) {
  const { t } = useI18n();
  const tier = tierForStyle(brief.designStyle);
  const ratio = (brief.buildingRatio ?? 60) / 100;
  const builtUp = Math.round(brief.landArea * ratio * (brief.floors ?? 4));
  const cost = estimateCost(builtUp, tier).total;
  const [totalCost, setTotalCost] = useState(cost);
  const [landCost, setLandCost] = useState(brief.budget ? Math.round(brief.budget * 0.35) : Math.round(brief.landArea * 3500));
  const [revenue, setRevenue] = useState(Math.round(builtUp * 0.82 * (tier === "luxury" ? 5200 : tier === "medium" ? 4200 : 3400)));
  const res = calcRoi({ totalCost, landCost, expectedRevenue: revenue });

  return (
    <Shell title={t.tools.roi} icon={TrendingUp} onClose={onClose}>
      <div className="space-y-3">
        <Field label="تكلفة البناء" value={totalCost} onChange={setTotalCost} suffix="ريال" />
        <Field label="تكلفة الأرض" value={landCost} onChange={setLandCost} suffix="ريال" />
        <Field label="الإيراد المتوقع" value={revenue} onChange={setRevenue} suffix="ريال" />
        <div className="space-y-2">
          <Result label="إجمالي الاستثمار" value={sar(res.investment)} />
          <Result label="صافي الربح" value={sar(res.netProfit)} accent />
          <div className="grid grid-cols-2 gap-2">
            <Result label="ROI" value={`${res.roi}%`} accent />
            <Result label="الاسترداد" value={`${res.paybackYears} سنة`} />
          </div>
        </div>
      </div>
    </Shell>
  );
}
