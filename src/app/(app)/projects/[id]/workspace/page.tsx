"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowRight,
  Sparkles,
  RefreshCw,
  Loader2,
  FileDown,
  FileText,
  FileJson,
  FileSpreadsheet,
  Lock,
} from "lucide-react";
import type { ArchitectReport } from "@/lib/domain/types";
import { getProject, saveReport } from "@/lib/data/projects-store";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/providers/auth-provider";
import { can } from "@/lib/rbac/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TOOLS } from "@/components/workspace/tools-registry";
import { ReportView } from "@/components/workspace/report-view";
import { AiAssistant } from "@/components/workspace/ai-assistant";
import { CostCalculator, RoiCalculator, ParkingCalculator } from "@/components/workspace/calculators";
import {
  exportReportPdf,
  exportReportWord,
  exportReportJson,
  exportReportExcel,
} from "@/lib/export/report-export";

type Modal = null | "cost" | "roi" | "parking";

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: project, isLoading } = useQuery({ queryKey: ["project", id], queryFn: () => getProject(id) });

  const [generating, setGenerating] = useState(false);
  const [modal, setModal] = useState<Modal>(null);

  const canRun = can(user?.role, "ai.run");
  const canExport = can(user?.role, "report.export");

  async function generate() {
    if (!project || generating) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: project.brief }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI_ERROR");
      const report = data.report as ArchitectReport;
      await saveReport(project.id, report);
      await qc.invalidateQueries({ queryKey: ["project", id] });
      await qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success(data.demo ? "تم توليد تقرير تجريبي (فعّل مفتاح Anthropic للتحليل الكامل)" : "تم توليد التقرير المعماري");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  function onToolClick(toolId: string, ready: boolean) {
    if (toolId === "report") return generate();
    if (toolId === "cost") return setModal("cost");
    if (toolId === "roi") return setModal("roi");
    if (toolId === "parking") return setModal("parking");
    if (!ready) toast.info(`${t.tools[toolId as keyof typeof t.tools]} — ${t.common.soon}`);
  }

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

  const report = project.report;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-1 flex items-center gap-2">
            <Link href={`/projects/${project.id}`} className="hover:text-primary">{project.name}</Link>
            <ArrowRight className="size-3 flip-on-rtl" />
            <span>{t.workspace.title}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t.workspace.tools}</h1>
        </div>
        {canRun && (
          <Button onClick={generate} disabled={generating}>
            {generating ? <Loader2 className="size-4 animate-spin" /> : report ? <RefreshCw className="size-4" /> : <Sparkles className="size-4" />}
            {report ? t.workspace.regenerate : t.workspace.generate}
          </Button>
        )}
      </div>

      {/* Tools grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const label = t.tools[tool.i18nKey as keyof typeof t.tools];
          const disabled = tool.kind === "ai" && !canRun;
          return (
            <button
              key={tool.id}
              onClick={() => onToolClick(tool.id, tool.ready)}
              disabled={disabled}
              className="mnc-card group relative flex flex-col items-start gap-2 p-4 text-start transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <span className="text-sm font-medium leading-tight">{label}</span>
              <span className="mt-auto">
                {tool.ready ? (
                  <Badge variant="success" className="text-[10px]">{t.workspace.runTool}</Badge>
                ) : (
                  <Badge variant="muted" className="text-[10px]">{t.common.soon}</Badge>
                )}
              </span>
              {disabled && <Lock className="absolute end-3 top-3 size-3.5 text-muted-foreground" />}
            </button>
          );
        })}
      </div>

      {/* Main split: report + assistant */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {report ? (
            <div className="space-y-4">
              {canExport && (
                <div className="mnc-card flex flex-wrap items-center gap-2 p-3">
                  <span className="me-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <FileDown className="size-3.5" /> مركز التصدير:
                  </span>
                  <Button variant="outline" size="sm" onClick={() => exportReportPdf(project, report)}>
                    <FileText className="size-3.5" /> {t.workspace.exportPdf}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportReportWord(project, report)}>
                    <FileText className="size-3.5" /> {t.workspace.exportWord}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportReportExcel(project, report)}>
                    <FileSpreadsheet className="size-3.5" /> Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportReportJson(project, report)}>
                    <FileJson className="size-3.5" /> JSON
                  </Button>
                </div>
              )}
              <ReportView report={report} />
            </div>
          ) : (
            <div className="mnc-card grid place-items-center py-20 text-center">
              <span className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="size-8" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{t.workspace.generate}</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                حوّل بيانات الأرض إلى دراسة معمارية متكاملة من 16 قسماً تشمل التحليل والخيارات والتكلفة والعائد.
              </p>
              {canRun && (
                <Button onClick={generate} disabled={generating} className="mt-5">
                  {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {generating ? t.workspace.generating : t.workspace.generate}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          {canRun ? (
            <AiAssistant brief={project.brief} report={report} />
          ) : (
            <div className="mnc-card grid place-items-center p-8 text-center text-sm text-muted-foreground">
              <Lock className="mb-2 size-5" />
              لا تملك صلاحية تشغيل المساعد المعماري.
            </div>
          )}
        </div>
      </div>

      {/* Calculator modals */}
      {modal === "cost" && <CostCalculator brief={project.brief} onClose={() => setModal(null)} />}
      {modal === "roi" && <RoiCalculator brief={project.brief} onClose={() => setModal(null)} />}
      {modal === "parking" && <ParkingCalculator brief={project.brief} onClose={() => setModal(null)} />}
    </div>
  );
}
