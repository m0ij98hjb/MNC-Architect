"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Sparkles,
  MapPin,
  Maximize,
  Layers,
  Compass,
  Ruler,
  Building2,
  Wallet,
  Palette,
  FileText,
  Clock,
} from "lucide-react";
import { getProject } from "@/lib/data/projects-store";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { sar, formatDate } from "@/lib/utils";

const statusVariant = { draft: "muted", active: "success", completed: "default", archived: "outline" } as const;

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, locale } = useI18n();
  const { data: project, isLoading } = useQuery({ queryKey: ["project", id], queryFn: () => getProject(id) });

  if (isLoading) return <Skeleton className="h-96" />;
  if (!project)
    return (
      <div className="mnc-card grid place-items-center py-20 text-center">
        <p className="text-muted-foreground">{t.common.noData}</p>
        <Link href="/projects" className="mt-4">
          <Button variant="outline">{t.projects.title}</Button>
        </Link>
      </div>
    );

  const b = project.brief;
  const facts: Array<[React.ElementType, string, string | number | undefined]> = [
    [MapPin, t.form.city, `${b.city} — ${b.district}`],
    [Maximize, t.form.landArea, `${b.landArea} م²`],
    [Ruler, t.form.dimensions, b.dimensions],
    [Compass, t.form.streetDirection, b.streetDirection],
    [Layers, t.form.floors, b.floors],
    [Building2, t.form.projectType, t.type[b.projectType]],
    [Palette, t.form.designStyle, t.style[b.designStyle]],
    [Wallet, t.form.budget, b.budget ? sar(b.budget) : undefined],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-1 flex items-center gap-2">
            <Link href="/projects" className="hover:text-primary">{t.projects.title}</Link>
            <ArrowRight className="size-3 flip-on-rtl" />
            <span>{project.client}</span>
          </div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
            {project.name}
            <Badge variant={statusVariant[project.status]}>{t.status[project.status]}</Badge>
          </h1>
        </div>
        <Link href={`/projects/${project.id}/workspace`}>
          <Button>
            <Sparkles className="size-4" /> {t.projects.workspace}
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="mnc-card p-5">
            <h3 className="mb-4 font-semibold">{t.form.section_land}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {facts.map(([Icon, label, value]) =>
                value ? (
                  <div key={label} className="flex items-center gap-3 rounded-xl border border-border bg-card/40 px-3 py-2.5">
                    <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground">{label}</div>
                      <div className="truncate text-sm font-medium">{value}</div>
                    </div>
                  </div>
                ) : null,
              )}
            </div>
            {b.notes && (
              <div className="mt-4 rounded-xl border border-border bg-card/40 p-3 text-sm">
                <div className="mb-1 text-[11px] text-muted-foreground">{t.form.notes}</div>
                {b.notes}
              </div>
            )}
          </div>

          <Link href={`/projects/${project.id}/workspace`} className="mnc-card flex items-center justify-between gap-4 p-5 transition-transform hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <FileText className="size-5" />
              </span>
              <div>
                <div className="font-semibold">{project.report ? "التقرير المعماري جاهز" : t.workspace.generate}</div>
                <div className="text-xs text-muted-foreground">
                  {project.report ? "افتح مساحة العمل لعرض/تصدير التقرير أو إعادة التوليد" : "افتح مساحة العمل لتوليد دراسة 16 قسماً"}
                </div>
              </div>
            </div>
            <ArrowRight className="size-5 flip-on-rtl text-muted-foreground" />
          </Link>
        </div>

        <div className="space-y-4">
          <div className="mnc-card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Clock className="size-4 text-primary" /> السجل الزمني
            </h3>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                <div>
                  <div className="text-sm">تم إنشاء المشروع</div>
                  <div className="text-[11px] text-muted-foreground">{formatDate(project.createdAt, locale)}</div>
                </div>
              </li>
              {project.report && (
                <li className="flex gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <div className="text-sm">تم توليد التقرير المعماري</div>
                    <div className="text-[11px] text-muted-foreground">{formatDate(project.report.generatedAt, locale)}</div>
                  </div>
                </li>
              )}
              {(project.timeline ?? []).map((ev) => (
                <li key={ev.id} className="flex gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-muted-foreground/40" />
                  <div>
                    <div className="text-sm">{ev.action}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {ev.userName} · {formatDate(ev.at, locale)}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
