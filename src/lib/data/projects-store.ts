"use client";

import { FIREBASE_ENABLED, db } from "@/lib/firebase/client";
import type { Project, ProjectBrief, ArchitectReport } from "@/lib/domain/types";
import { uid } from "@/lib/utils";

const LS_KEY = "mnc_projects";

// ===== Seed data (demo mode only) =====
function seed(): Project[] {
  const now = Date.now();
  const base = (over: Partial<Project> & { brief: ProjectBrief; name: string; client: string }): Project => ({
    id: uid("prj"),
    status: "active",
    ownerUid: "demo",
    createdAt: now,
    updatedAt: now,
    ...over,
  });
  return [
    base({
      name: "برج سكني — حي الشاطئ",
      client: "مجموعة الفهد العقارية",
      status: "active",
      brief: {
        city: "جدة",
        district: "الشاطئ",
        landArea: 1000,
        dimensions: "25×40",
        streetWidth: 20,
        streetDirection: "شمالي",
        streetsCount: 2,
        buildingRatio: 60,
        floors: 6,
        projectType: "residential_apartments",
        targetUnits: 24,
        budget: 18000000,
        designStyle: "modern_luxury",
      },
    }),
    base({
      name: "مجمع تجاري — طريق الملك",
      client: "شركة ركائز",
      status: "completed",
      brief: {
        city: "الرياض",
        district: "العليا",
        landArea: 1500,
        buildingRatio: 65,
        floors: 4,
        projectType: "commercial",
        designStyle: "contemporary",
        budget: 26000000,
      },
    }),
    base({
      name: "فيلا فاخرة — الياسمين",
      client: "عميل خاص",
      status: "draft",
      brief: {
        city: "الرياض",
        district: "الياسمين",
        landArea: 600,
        buildingRatio: 50,
        floors: 2,
        projectType: "villa",
        designStyle: "neoclassic",
      },
    }),
  ];
}

function readLS(): Project[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) {
    const s = seed();
    localStorage.setItem(LS_KEY, JSON.stringify(s));
    return s;
  }
  try {
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}
function writeLS(items: Project[]) {
  if (typeof window !== "undefined") localStorage.setItem(LS_KEY, JSON.stringify(items));
}

// ===== Public API (same surface for demo + Firestore) =====
export async function listProjects(): Promise<Project[]> {
  if (FIREBASE_ENABLED && db) {
    const { collection, getDocs, query, orderBy } = await import("firebase/firestore");
    const snap = await getDocs(query(collection(db, "projects"), orderBy("updatedAt", "desc")));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Project, "id">) }));
  }
  return readLS().sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProject(id: string): Promise<Project | null> {
  if (FIREBASE_ENABLED && db) {
    const { doc, getDoc } = await import("firebase/firestore");
    const snap = await getDoc(doc(db, "projects", id));
    return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Project, "id">) }) : null;
  }
  return readLS().find((p) => p.id === id) ?? null;
}

export async function createProject(input: { name: string; client: string; brief: ProjectBrief; ownerUid: string }): Promise<Project> {
  const project: Project = {
    id: uid("prj"),
    name: input.name,
    client: input.client,
    status: "draft",
    brief: input.brief,
    ownerUid: input.ownerUid,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    timeline: [{ id: uid("ev"), at: Date.now(), userName: "النظام", action: "إنشاء المشروع" }],
  };
  if (FIREBASE_ENABLED && db) {
    const { doc, setDoc } = await import("firebase/firestore");
    const { id, ...rest } = project;
    await setDoc(doc(db, "projects", id), rest);
    return project;
  }
  const items = readLS();
  items.unshift(project);
  writeLS(items);
  return project;
}

export async function saveReport(id: string, report: ArchitectReport): Promise<void> {
  if (FIREBASE_ENABLED && db) {
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "projects", id), { report, updatedAt: Date.now(), status: "active" });
    return;
  }
  const items = readLS();
  const i = items.findIndex((p) => p.id === id);
  if (i >= 0) {
    items[i].report = report;
    items[i].updatedAt = Date.now();
    items[i].status = "active";
    items[i].timeline = [
      ...(items[i].timeline ?? []),
      { id: uid("ev"), at: Date.now(), userName: "MNC Agent", action: "توليد التقرير المعماري" },
    ];
    writeLS(items);
  }
}
