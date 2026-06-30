"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, FolderKanban, Building2, MapPin, Layers } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/providers/auth-provider";
import { can } from "@/lib/rbac/permissions";
import { listProjects } from "@/lib/data/projects-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

const statusVariant = { draft: "muted", active: "success", completed: "default", archived: "outline" } as const;

export default function ProjectsPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const { data: projects = [], isLoading } = useQuery({ queryKey: ["projects"], queryFn: listProjects });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-1">MNC · PROJECTS</div>
          <h1 className="text-2xl font-bold tracking-tight">{t.projects.title}</h1>
        </div>
        {can(user?.role, "project.create") && (
          <Link href="/projects/new">
            <Button>
              <Plus className="size-4" /> {t.projects.create}
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="mnc-card grid place-items-center py-20 text-center">
          <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
            <FolderKanban className="size-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">{t.projects.empty}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t.projects.emptyHint}</p>
          {can(user?.role, "project.create") && (
            <Link href="/projects/new" className="mt-5">
              <Button>
                <Plus className="size-4" /> {t.projects.create}
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="mnc-card group block p-5 transition-transform hover:-translate-y-0.5">
              <div className="mb-3 flex items-start justify-between">
                <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </div>
                <Badge variant={statusVariant[p.status]}>{t.status[p.status]}</Badge>
              </div>
              <h3 className="line-clamp-1 font-semibold tracking-tight group-hover:text-primary">{p.name}</h3>
              <p className="mb-3 line-clamp-1 text-sm text-muted-foreground">{p.client}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" /> {p.brief.city} · {p.brief.district}
                </span>
                <span className="flex items-center gap-1">
                  <Layers className="size-3.5" /> {t.type[p.brief.projectType]}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
                <span>{formatDate(p.updatedAt, locale)}</span>
                {p.report && <span className="text-primary">✓ تقرير جاهز</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
