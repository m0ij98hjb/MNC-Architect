"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban, Activity, CheckCircle2, Coins, TrendingUp, MapPin, ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { listProjects } from "@/lib/data/projects-store";
import { StatCard } from "@/components/dashboard/stat-card";
import { MonthlyBar, TypesDoughnut } from "@/components/dashboard/charts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { sar, pct, formatDate } from "@/lib/utils";
import type { Project } from "@/lib/domain/types";

const statusVariant = { draft: "muted", active: "success", completed: "default", archived: "outline" } as const;

export default function DashboardPage() {
  const { t, locale } = useI18n();
  const { data: projects = [], isLoading } = useQuery({ queryKey: ["projects"], queryFn: listProjects });

  const stats = computeStats(projects);

  return (
    <div className="space-y-7">
      <div>
        <div className="eyebrow mb-1">{t.dashboard.title}</div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t.dashboard.welcome} <span className="text-gold-gradient">MNC Architect AI</span>
        </h1>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t.dashboard.totalProjects} value={String(stats.total)} icon={FolderKanban} accent="gold" />
          <StatCard label={t.dashboard.activeProjects} value={String(stats.active)} icon={Activity} accent="sky" />
          <StatCard label={t.dashboard.completedProjects} value={String(stats.completed)} icon={CheckCircle2} accent="emerald" />
          <StatCard label={t.dashboard.avgRoi} value={pct(stats.avgRoi)} icon={TrendingUp} accent="violet" />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t.dashboard.monthlyProjects}</CardTitle>
          </CardHeader>
          <div className="h-64">
            <MonthlyBar labels={stats.months} data={stats.monthly} />
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.dashboard.topTypes}</CardTitle>
          </CardHeader>
          <div className="h-64">
            <TypesDoughnut labels={stats.typeLabels.map((k) => t.type[k as keyof typeof t.type] ?? k)} data={stats.typeCounts} />
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">{t.dashboard.recent}</CardTitle>
            <Link href="/projects" className="text-xs text-primary hover:underline">
              {t.projects.title}
            </Link>
          </CardHeader>
          <div className="divide-y divide-border">
            {projects.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="group flex items-center gap-3 py-3 transition-colors hover:bg-accent/40 -mx-2 px-2 rounded-md"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FolderKanban className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {p.client} · {p.brief.city} · {formatDate(p.updatedAt, locale)}
                  </div>
                </div>
                <Badge variant={statusVariant[p.status]}>{t.status[p.status]}</Badge>
                <ArrowLeft className="size-4 text-muted-foreground transition-transform group-hover:-translate-x-1 flip-on-rtl" />
              </Link>
            ))}
            {!isLoading && projects.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">{t.projects.empty}</div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.dashboard.topCities}</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {stats.topCities.map(([city, count]) => (
              <div key={city}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-primary" /> {city}
                  </span>
                  <span className="tnum text-muted-foreground">{count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(count / stats.total) * 100}%` }} />
                </div>
              </div>
            ))}
            <div className="border-t border-border pt-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Coins className="size-3.5" /> {t.dashboard.avgCost}
                </span>
                <span className="tnum font-medium">{sar(stats.avgCost, { compact: true })}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function computeStats(projects: Project[]) {
  const total = projects.length || 0;
  const active = projects.filter((p) => p.status === "active").length;
  const completed = projects.filter((p) => p.status === "completed").length;

  const rois = projects.map((p) => p.report?.roi).filter((v): v is number => typeof v === "number");
  const avgRoi = rois.length ? rois.reduce((a, b) => a + b, 0) / rois.length : 0;

  const costs = projects.map((p) => p.report?.estimatedCost.total).filter((v): v is number => typeof v === "number");
  const avgCost = costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;

  const cityMap = new Map<string, number>();
  projects.forEach((p) => cityMap.set(p.brief.city, (cityMap.get(p.brief.city) ?? 0) + 1));
  const topCities = [...cityMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  const typeMap = new Map<string, number>();
  projects.forEach((p) => typeMap.set(p.brief.projectType, (typeMap.get(p.brief.projectType) ?? 0) + 1));
  const typeLabels = [...typeMap.keys()];
  const typeCounts = [...typeMap.values()];

  // monthly (last 6 months)
  const months: string[] = [];
  const monthly: number[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(new Intl.DateTimeFormat("ar-SA", { month: "short" }).format(d));
    monthly.push(
      projects.filter((p) => {
        const c = new Date(p.createdAt);
        return c.getMonth() === d.getMonth() && c.getFullYear() === d.getFullYear();
      }).length
    );
  }

  return { total, active, completed, avgRoi, avgCost, topCities, typeLabels, typeCounts, months, monthly };
}
