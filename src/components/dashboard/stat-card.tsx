import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "gold",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  accent?: "gold" | "emerald" | "sky" | "violet";
}) {
  const iconCls = {
    gold:    "bg-primary/12 text-primary",
    emerald: "bg-emerald-500/12 text-emerald-500",
    sky:     "bg-sky-500/12 text-sky-500",
    violet:  "bg-violet-500/12 text-violet-500",
  };
  /* subtle left-border accent strip */
  const stripCls = {
    gold:    "bg-primary",
    emerald: "bg-emerald-500",
    sky:     "bg-sky-500",
    violet:  "bg-violet-500",
  };

  return (
    <div className="mnc-card relative flex items-center gap-4 overflow-hidden p-5">
      {/* vertical accent strip */}
      <span className={cn("absolute inset-y-0 start-0 w-[3px] rounded-full opacity-70", stripCls[accent])} />

      <div className={cn("grid size-12 shrink-0 place-items-center rounded-xl", iconCls[accent])}>
        <Icon className="size-6" />
      </div>
      <div className="min-w-0 ps-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="tnum text-2xl font-bold tracking-tight">{value}</div>
        {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
}
