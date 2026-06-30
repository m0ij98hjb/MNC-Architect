"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, Building2, Map, Palette } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/providers/auth-provider";
import { createProject } from "@/lib/data/projects-store";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().min(2),
  client: z.string().min(2),
  city: z.string().min(2),
  district: z.string().min(1),
  plotNumber: z.string().optional(),
  landArea: z.coerce.number().positive(),
  dimensions: z.string().optional(),
  streetWidth: z.coerce.number().optional(),
  streetDirection: z.string().optional(),
  streetsCount: z.coerce.number().optional(),
  buildingRatio: z.coerce.number().optional(),
  setbacks: z.string().optional(),
  floors: z.coerce.number().optional(),
  projectType: z.enum(["residential_apartments", "villa", "residential_complex", "commercial", "mixed_use", "office"]),
  targetUnits: z.coerce.number().optional(),
  budget: z.coerce.number().optional(),
  designStyle: z.enum(["economic", "modern_luxury", "neoclassic", "contemporary", "max_roi"]),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function NewProjectPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { projectType: "residential_apartments", designStyle: "modern_luxury", buildingRatio: 60, floors: 4 },
  });

  const onSubmit = async (v: FormValues) => {
    if (!user) return;
    setSaving(true);
    try {
      const project = await createProject({
        name: v.name,
        client: v.client,
        ownerUid: user.uid,
        brief: {
          city: v.city,
          district: v.district,
          plotNumber: v.plotNumber,
          landArea: v.landArea,
          dimensions: v.dimensions,
          streetWidth: v.streetWidth,
          streetDirection: v.streetDirection,
          streetsCount: v.streetsCount,
          buildingRatio: v.buildingRatio,
          setbacks: v.setbacks,
          floors: v.floors,
          projectType: v.projectType,
          targetUnits: v.targetUnits,
          budget: v.budget,
          designStyle: v.designStyle,
          notes: v.notes,
        },
      });
      await qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("تم إنشاء المشروع");
      router.push(`/projects/${project.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const err = (k: keyof FormValues) => errors[k] && <span className="mt-1 block text-[11px] text-destructive">{t.form.required}</span>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="eyebrow mb-1">NEW STUDY</div>
        <h1 className="text-2xl font-bold tracking-tight">{t.nav.newProject}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-primary" /> {t.form.section_basic}
            </CardTitle>
          </CardHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t.projects.name}</Label>
              <Input {...register("name")} placeholder="برج سكني — حي الشاطئ" />
              {err("name")}
            </div>
            <div>
              <Label>{t.projects.client}</Label>
              <Input {...register("client")} placeholder="اسم العميل / الجهة" />
              {err("client")}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Map className="size-4 text-primary" /> {t.form.section_land}
            </CardTitle>
          </CardHeader>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>{t.form.city}</Label>
              <Input {...register("city")} placeholder="جدة" />
              {err("city")}
            </div>
            <div>
              <Label>{t.form.district}</Label>
              <Input {...register("district")} placeholder="الشاطئ" />
              {err("district")}
            </div>
            <div>
              <Label>{t.form.plotNumber}</Label>
              <Input {...register("plotNumber")} placeholder="—" />
            </div>
            <div>
              <Label>{t.form.landArea}</Label>
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
              <Input {...register("setbacks")} placeholder="2م جانبي / 3م خلفي" />
            </div>
            <div>
              <Label>{t.form.floors}</Label>
              <Input type="number" {...register("floors")} placeholder="4" />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="size-4 text-primary" /> {t.form.section_design}
            </CardTitle>
          </CardHeader>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>{t.form.projectType}</Label>
              <Select {...register("projectType")}>
                {Object.entries(t.type).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>{t.form.designStyle}</Label>
              <Select {...register("designStyle")}>
                {Object.entries(t.style).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
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
              <Textarea {...register("notes")} placeholder="أي متطلبات خاصة بالعميل…" />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t.form.cancel}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {t.form.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
