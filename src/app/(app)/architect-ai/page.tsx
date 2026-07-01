"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Sparkles,
  Loader2,
  FileDown,
  FileText,
  FileJson,
  FileSpreadsheet,
  Save,
  CheckCircle2,
  RefreshCw,
  BrainCircuit,
  AlertTriangle,
  X,
  Map,
  Palette,
  FolderOpen,
  ArrowRight,
  PenLine,
} from "lucide-react";
import type { ArchitectReport, ProjectBrief, Project } from "@/lib/domain/types";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/providers/auth-provider";
import { createProject, saveReport, getProject, updateProject } from "@/lib/data/projects-store";
import {
  exportReportPdf,
  exportReportWord,
  exportReportJson,
  exportReportExcel,
} from "@/lib/export/report-export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportView } from "@/components/workspace/report-view";
import { ProgressTimeline } from "@/components/architect-ai/progress-timeline";
import { FloorPlanView } from "@/components/architect-ai/floor-plan-view";
import { MassingView } from "@/components/architect-ai/massing-view";
import { RenderPromptsView } from "@/components/architect-ai/render-prompts-view";
import { ComparisonView } from "@/components/architect-ai/comparison-view";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ─── Zod schema ──────────────────────────────────────────────────────────────
const optNum = z.preprocess(
  (v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  },
  z.number().positive().optional()
);

const schema = z.object({
  city: z.string().min(2),
  district: z.string().min(1),
  plotNumber: z.string().optional(),
  landArea: z.coerce.number().positive(),
  dimensions: z.string().optional(),
  streetWidth: optNum,
  streetDirection: z.string().optional(),
  streetsCount: optNum,
  buildingRatio: optNum,
  setbacks: z.string().optional(),
  floors: optNum,
  projectType: z.enum([
    "residential_apartments",
    "villa",
    "residential_complex",
    "commercial",
    "mixed_use",
    "office",
  ]),
  targetUnits: optNum,
  budget: optNum,
  designStyle: z.enum(["economic", "modern_luxury", "neoclassic", "contemporary", "max_roi"]),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

type Phase = "form" | "generating" | "results";
type Tab = "report" | "floorplan" | "model3d" | "prompts" | "comparison";

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ArchitectAiPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const ai = t.architectAi;
  const searchParams = useSearchParams();
  const router = useRouter();

  // Edit-mode state (when loading existing project)
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectClient, setEditProjectClient] = useState("");
  const [projectLoading, setProjectLoading] = useState(false);

  // Phase & UI state
  const [phase, setPhase] = useState<Phase>("form");
  const [tab, setTab] = useState<Tab>("report");
  const [brief, setBrief] = useState<ProjectBrief | null>(null);
  const [report, setReport] = useState<ArchitectReport | null>(null);
  const [step, setStep] = useState(0);
  const [showSave, setShowSave] = useState(false);
  const [saved, setSaved] = useState(false);
  const [completedTabs, setCompletedTabs] = useState<Set<Tab>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectType: "residential_apartments",
      designStyle: "modern_luxury",
      buildingRatio: 60,
      floors: 4,
    },
  });

  // ── Load project from URL ?id= param ──────────────────────────────────────
  const projectIdParam = searchParams.get("id");

  useEffect(() => {
    if (!projectIdParam) return;
    setProjectLoading(true);
    setEditProjectId(projectIdParam);

    getProject(projectIdParam)
      .then((proj) => {
        if (!proj) {
          toast.error(locale === "ar" ? "المشروع غير موجود" : "Project not found");
          setProjectLoading(false);
          return;
        }
        setEditProjectName(proj.name);
        setEditProjectClient(proj.client);

        // Pre-fill form with the project's brief
        const b = proj.brief;
        reset({
          city: b.city ?? "",
          district: b.district ?? "",
          plotNumber: b.plotNumber,
          landArea: b.landArea,
          dimensions: b.dimensions,
          streetWidth: b.streetWidth,
          streetDirection: b.streetDirection,
          streetsCount: b.streetsCount,
          buildingRatio: b.buildingRatio,
          setbacks: b.setbacks,
          floors: b.floors,
          projectType: b.projectType ?? "residential_apartments",
          targetUnits: b.targetUnits,
          budget: b.budget,
          designStyle: b.designStyle ?? "modern_luxury",
          notes: b.notes,
        });

        setBrief(b);

        // If project already has a report, show results directly
        if (proj.report) {
          setReport(proj.report);
          setPhase("results");
          setTab("report");
          setCompletedTabs(new Set<Tab>(["report"]));
          setSaved(true);
        }

        setProjectLoading(false);
      })
      .catch(() => {
        toast.error(locale === "ar" ? "خطأ في تحميل المشروع" : "Error loading project");
        setProjectLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectIdParam]);

  const err = (k: keyof FormValues) =>
    errors[k] && (
      <span className="mt-1 block text-[11px] text-destructive">{t.form.required}</span>
    );

  const isEditMode = Boolean(editProjectId);

  // ── Generate ──────────────────────────────────────────────────────────────
  async function onSubmit(values: FormValues) {
    const b: ProjectBrief = { ...values };
    setBrief(b);
    setPhase("generating");
    setStep(0);
    setSaved(false);
    setCompletedTabs(new Set());

    // If editing an existing project, update its brief first
    if (editProjectId) {
      try {
        await updateProject(editProjectId, { brief: b });
      } catch { /* non-critical, continue */ }
    }

    // Animate progress steps (~9s total)
    timerRef.current = setInterval(() => {
      setStep((s) => {
        if (s < 8) return s + 1;
        if (timerRef.current) clearInterval(timerRef.current);
        return s;
      });
    }, 950);

    try {
      const res = await fetch("/api/architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: b }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI_ERROR");

      const r = data.report as ArchitectReport;
      if (timerRef.current) clearInterval(timerRef.current);
      setStep(8);
      setReport(r);

      // In edit mode: auto-save report to existing project
      if (editProjectId) {
        try {
          await saveReport(editProjectId, r);
          await qc.invalidateQueries({ queryKey: ["projects"] });
          await qc.invalidateQueries({ queryKey: ["project", editProjectId] });
          setSaved(true);
        } catch { /* ignore */ }
      }

      setTimeout(() => {
        setPhase("results");
        setTab("report");
        setCompletedTabs(new Set<Tab>(["report"]));
        if (data.demo) {
          toast.info(
            locale === "ar"
              ? "تقرير تجريبي — فعّل مفتاح ANTHROPIC_API_KEY للتحليل الكامل"
              : "Demo report — enable ANTHROPIC_API_KEY for full AI analysis"
          );
        } else {
          toast.success(
            isEditMode
              ? locale === "ar" ? "تم تحديث الدراسة وحفظها" : "Study updated and saved"
              : locale === "ar" ? "تم توليد الدراسة بنجاح" : "Study generated successfully"
          );
        }
      }, 700);
    } catch (e) {
      if (timerRef.current) clearInterval(timerRef.current);
      toast.error((e as Error).message ?? "حدث خطأ");
      setPhase("form");
    }
  }

  function goTab(next: Tab) {
    setTab(next);
    setCompletedTabs((prev) => new Set([...prev, next]));
  }

  function resetAll() {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("form");
    setReport(null);
    setBrief(null);
    setStep(0);
    setSaved(false);
    setCompletedTabs(new Set());
    if (!isEditMode) {
      reset();
    }
  }

  // ── Export helpers ────────────────────────────────────────────────────────
  function buildProject(): Project {
    return {
      id: editProjectId ?? "architect-ai-" + Date.now(),
      name: editProjectName || (brief
        ? `${t.type[brief.projectType as keyof typeof t.type]} — ${brief.city}`
        : "Architect AI Study"),
      client: editProjectClient || "—",
      brief: brief!,
      status: "active",
      ownerUid: user?.uid ?? "guest",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  // ── Save to projects (create-mode only) ───────────────────────────────────
  async function handleSave(name: string, client: string) {
    if (!brief || !report || !user) return;
    try {
      const project = await createProject({ name, client, brief, ownerUid: user.uid });
      await saveReport(project.id, report);
      await qc.invalidateQueries({ queryKey: ["projects"] });
      setSaved(true);
      setShowSave(false);
      toast.success(locale === "ar" ? "تم الحفظ في المشاريع" : "Saved to Projects");
      router.push(`/projects/${project.id}`);
    } catch {
      toast.error(locale === "ar" ? "فشل الحفظ" : "Save failed");
    }
  }

  // ── Tab labels ─────────────────────────────────────────────────────────────
  const TAB_LABELS: Record<Tab, string> = {
    report: ai.phases.report,
    floorplan: ai.phases.floorplan,
    model3d: ai.phases.model3d,
    prompts: ai.phases.prompts,
    comparison: ai.phases.comparison,
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  if (projectLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        {isEditMode ? (
          <>
            <div className="eyebrow mb-1 flex items-center gap-2">
              <Link href="/projects" className="hover:text-primary">{t.projects.title}</Link>
              <ArrowRight className="size-3 flip-on-rtl" />
              <span className="text-muted-foreground">{editProjectName}</span>
            </div>
            <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
              <BrainCircuit className="size-6 text-primary" />
              {editProjectName}
              <Badge variant="muted" className="gap-1 text-xs">
                <PenLine className="size-3" />
                {locale === "ar" ? "تحرير" : "Edit"}
              </Badge>
            </h1>
            {editProjectClient && editProjectClient !== "—" && (
              <p className="mt-1 text-sm text-muted-foreground">{editProjectClient}</p>
            )}
          </>
        ) : (
          <>
            <div className="eyebrow mb-1 flex items-center gap-2">
              <BrainCircuit className="size-3.5" />
              {ai.badge}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{ai.title}</h1>
            {phase === "form" && (
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{ai.subtitle}</p>
            )}
          </>
        )}
      </div>

      {/* ══ FORM ══════════════════════════════════════════════════════════════ */}
      {phase === "form" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {isEditMode && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              <FolderOpen className="size-4 shrink-0 text-primary" />
              <span>
                {locale === "ar"
                  ? "بيانات المشروع محملة — عدّل ما تريد ثم أعد توليد الدراسة"
                  : "Project data loaded — edit fields then regenerate the study"}
              </span>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Land data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    <Map className="size-4" />
                  </span>
                  {t.form.section_land}
                </CardTitle>
              </CardHeader>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label>{t.form.city} *</Label>
                  <Input {...register("city")} placeholder="جدة" />
                  {err("city")}
                </div>
                <div>
                  <Label>{t.form.district} *</Label>
                  <Input {...register("district")} placeholder="الشاطئ" />
                  {err("district")}
                </div>
                <div>
                  <Label>{t.form.plotNumber}</Label>
                  <Input {...register("plotNumber")} placeholder="—" />
                </div>
                <div>
                  <Label>{t.form.landArea} *</Label>
                  <Input type="number" {...register("landArea")} placeholder="1000" />
                  {err("landArea")}
                </div>
                <div>
                  <Label>{t.form.dimensions}</Label>
                  <Input {...register("dimensions")} placeholder="25×40" />
                </div>
                <div>
                  <Label>{t.form.streetWidth}</Label>
                  <Input type="number" {...register("streetWidth")} placeholder="20" />
                </div>
                <div>
                  <Label>{t.form.streetDirection}</Label>
                  <Input {...register("streetDirection")} placeholder="شمالي" />
                </div>
                <div>
                  <Label>{t.form.streetsCount}</Label>
                  <Input type="number" {...register("streetsCount")} placeholder="1" />
                </div>
                <div>
                  <Label>{t.form.buildingRatio}</Label>
                  <Input type="number" {...register("buildingRatio")} placeholder="60" />
                </div>
                <div>
                  <Label>{t.form.setbacks}</Label>
                  <Input {...register("setbacks")} placeholder="5م أمامي · 2م جانبي · 3م خلفي" />
                </div>
                <div>
                  <Label>{t.form.floors}</Label>
                  <Input type="number" {...register("floors")} placeholder="4" />
                </div>
              </div>
            </Card>

            {/* Design & budget */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-sm text-primary">
                    <Palette className="size-4" />
                  </span>
                  {t.form.section_design}
                </CardTitle>
              </CardHeader>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label>{t.form.projectType}</Label>
                  <Select {...register("projectType")}>
                    {Object.entries(t.type).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>{t.form.designStyle}</Label>
                  <Select {...register("designStyle")}>
                    {Object.entries(t.style).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>{t.form.targetUnits}</Label>
                  <Input type="number" {...register("targetUnits")} placeholder="24" />
                </div>
                <div>
                  <Label>{t.form.budget}</Label>
                  <Input type="number" {...register("budget")} placeholder="18000000" />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <Label>{t.form.notes}</Label>
                  <Textarea {...register("notes")} placeholder="أي متطلبات خاصة بالعميل أو المشروع…" rows={3} />
                </div>
              </div>
            </Card>

            <div className="flex justify-end gap-3">
              {isEditMode && (
                <Button type="button" variant="outline" onClick={() => {
                  if (report) {
                    setPhase("results");
                  }
                }}>
                  {locale === "ar" ? "عرض التقرير الحالي" : "View Current Report"}
                </Button>
              )}
              <Button type="submit" size="lg">
                <Sparkles className="size-4" />
                {isEditMode
                  ? (locale === "ar" ? "إعادة توليد الدراسة" : "Regenerate Study")
                  : ai.form.generate}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* ══ GENERATING ═══════════════════════════════════════════════════════ */}
      {phase === "generating" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mnc-card mx-auto max-w-lg py-10 text-center"
        >
          <span className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Loader2 className="size-8 animate-spin" />
          </span>
          <h2 className="mb-7 text-lg font-semibold">{ai.form.generating}</h2>
          <ProgressTimeline currentStep={step} />
        </motion.div>
      )}

      {/* ══ RESULTS ══════════════════════════════════════════════════════════ */}
      {phase === "results" && brief && report && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

          {/* Phase navigation bar */}
          <div className="mnc-card flex flex-wrap items-center gap-1 p-1.5">
            {(Object.keys(TAB_LABELS) as Tab[]).map((tabKey) => {
              const isActive = tab === tabKey;
              const isDone = completedTabs.has(tabKey) && !isActive;
              return (
                <button
                  key={tabKey}
                  onClick={() => goTab(tabKey)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {isDone && <CheckCircle2 className="size-3 text-emerald-500" />}
                  {TAB_LABELS[tabKey]}
                </button>
              );
            })}

            <div className="ms-auto flex items-center gap-1.5">
              {/* Edit brief button */}
              <Button size="sm" variant="ghost" onClick={resetAll} className="gap-1.5 text-xs">
                <PenLine className="size-3.5" />
                <span className="hidden sm:inline">
                  {locale === "ar" ? "تعديل البيانات" : "Edit Brief"}
                </span>
              </Button>

              {saved ? (
                isEditMode ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="size-3" />
                    {locale === "ar" ? "محفوظ في المشروع" : "Saved to Project"}
                  </Badge>
                ) : (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="size-3" /> {ai.report_actions.saved}
                  </Badge>
                )
              ) : (
                !isEditMode && (
                  <Button size="sm" variant="outline" onClick={() => setShowSave(true)}>
                    <Save className="size-3.5" />
                    <span className="hidden sm:inline">{ai.report_actions.save}</span>
                  </Button>
                )
              )}

              {isEditMode && (
                <Link href={`/projects/${editProjectId}`}>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <FolderOpen className="size-3.5" />
                    <span className="hidden sm:inline">
                      {locale === "ar" ? "صفحة المشروع" : "Project Page"}
                    </span>
                  </Button>
                </Link>
              )}

              <Button size="sm" variant="outline" onClick={resetAll}>
                <RefreshCw className="size-3.5" />
                <span className="hidden sm:inline">{ai.form.reset}</span>
              </Button>
            </div>
          </div>

          {/* ── Tab: Report ─────────────────────────────────────────────────── */}
          {tab === "report" && (
            <div className="space-y-4">
              {/* Export bar */}
              <div className="mnc-card flex flex-wrap items-center gap-2 p-3">
                <span className="me-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <FileDown className="size-3.5" />
                  {locale === "ar" ? "تصدير:" : "Export:"}
                </span>
                <Button variant="outline" size="sm" onClick={() => exportReportPdf(buildProject(), report)}>
                  <FileText className="size-3.5" /> PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportReportWord(buildProject(), report)}>
                  <FileText className="size-3.5" /> Word
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportReportExcel(buildProject(), report)}>
                  <FileSpreadsheet className="size-3.5" /> Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportReportJson(buildProject(), report)}>
                  <FileJson className="size-3.5" /> JSON
                </Button>
              </div>

              <ReportView report={report} />

              <div className="flex justify-end pt-2">
                <Button size="lg" onClick={() => goTab("floorplan")}>
                  <Sparkles className="size-4" />
                  {ai.report_actions.goto_floorplan}
                </Button>
              </div>
            </div>
          )}

          {/* ── Tab: Floor Plans ─────────────────────────────────────────────── */}
          {tab === "floorplan" && (
            <div className="space-y-4">
              <FloorPlanView brief={brief} report={report} />
              <div className="flex justify-end pt-2">
                <Button size="lg" onClick={() => goTab("model3d")}>
                  <Sparkles className="size-4" />
                  {ai.floorplan.goto_3d}
                </Button>
              </div>
            </div>
          )}

          {/* ── Tab: 3D Model ────────────────────────────────────────────────── */}
          {tab === "model3d" && (
            <div className="space-y-4">
              <MassingView brief={brief} report={report} />
              <div className="flex justify-end pt-2">
                <Button size="lg" onClick={() => goTab("prompts")}>
                  <Sparkles className="size-4" />
                  {ai.model3d.goto_prompts}
                </Button>
              </div>
            </div>
          )}

          {/* ── Tab: Render Prompts ───────────────────────────────────────────── */}
          {tab === "prompts" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{ai.prompts.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{ai.prompts.subtitle}</p>
              </div>
              <RenderPromptsView brief={brief} report={report} />
              <div className="flex justify-end pt-2">
                <Button size="lg" onClick={() => goTab("comparison")}>
                  <Sparkles className="size-4" />
                  {ai.prompts.goto_comparison}
                </Button>
              </div>
            </div>
          )}

          {/* ── Tab: Comparison ──────────────────────────────────────────────── */}
          {tab === "comparison" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{ai.comparison.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{ai.comparison.subtitle}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportReportPdf(buildProject(), report)}>
                    <FileText className="size-3.5" /> {ai.comparison.export_pdf}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportReportExcel(buildProject(), report)}>
                    <FileSpreadsheet className="size-3.5" /> {ai.comparison.export_excel}
                  </Button>
                </div>
              </div>
              <ComparisonView brief={brief} report={report} />

              {/* Final action: if not saved yet and not in edit mode */}
              {!saved && !isEditMode && (
                <div className="flex justify-end pt-2">
                  <Button size="lg" onClick={() => setShowSave(true)}>
                    <Save className="size-4" />
                    {ai.report_actions.save}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Legal notice */}
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
            <span>{ai.legal}</span>
          </div>
        </motion.div>
      )}

      {/* ══ SAVE DIALOG (create-mode only) ════════════════════════════════════ */}
      {showSave && brief && !isEditMode && (
        <SaveDialog
          labels={ai.save_dialog}
          defaultName={`${t.type[brief.projectType as keyof typeof t.type]} — ${brief.city}`}
          onSave={handleSave}
          onClose={() => setShowSave(false)}
        />
      )}
    </div>
  );
}

// ─── Save Dialog ─────────────────────────────────────────────────────────────
function SaveDialog({
  labels,
  defaultName,
  onSave,
  onClose,
}: {
  labels: { title: string; name: string; client: string; save: string; cancel: string };
  defaultName: string;
  onSave: (name: string, client: string) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(defaultName);
  const [client, setClient] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), client.trim() || "—");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mnc-card w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">{labels.title}</h3>
          <button
            onClick={onClose}
            className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <Label>{labels.name}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <Label>{labels.client}</Label>
            <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="—" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={submit} disabled={saving || !name.trim()} className="flex-1">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {labels.save}
          </Button>
          <Button variant="outline" onClick={onClose}>
            {labels.cancel}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
