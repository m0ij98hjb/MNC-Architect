"use client";

import { useRef, useState, useCallback } from "react";
import {
  ZoomIn, ZoomOut, Maximize2, RotateCcw, Download, Printer,
} from "lucide-react";
import type { ProjectBrief, ArchitectReport } from "@/lib/domain/types";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

// ─── Room colour palette (white-bg architectural drawing) ───────────────────
const C = {
  unit:    "#F9F5EE",
  lobby:   "#FFF9E8",
  core:    "#E6E6E6",
  service: "#EDE8E4",
  parking: "#EBF0F8",
  open:    "#EDF7ED",
  wall:    "#1A1A1A",
  dim:     "#555",
  label:   "#2A2A2A",
  grid:    "#D8D8D8",
  setback: "#C8D8E8",
};

// ─── Types ──────────────────────────────────────────────────────────────────
interface Room {
  id: string;
  x: number; y: number; w: number; h: number; // % of building footprint
  label: string; labelEn: string;
  fill: string;
  fontSize?: number;
  dashed?: boolean;
}

// ─── Dimension helpers ───────────────────────────────────────────────────────
function parseDims(dims?: string, area = 500): { w: number; h: number } {
  if (dims) {
    const m = dims.match(/(\d+(?:\.\d+)?)[×xX×*](\d+(?:\.\d+)?)/);
    if (m) return { w: +m[1], h: +m[2] };
  }
  const s = Math.sqrt(area);
  return { w: Math.round(s * 0.85), h: Math.round(area / Math.round(s * 0.85)) };
}
function parseSB(sb?: string) {
  const d = { front: 5, back: 3, start: 2, end: 2 };
  if (!sb) return d;
  const n = (sb.match(/\d+(?:\.\d+)?/g) || []).map(Number);
  if (n[0]) d.front = n[0];
  if (n[1]) d.back = n[1];
  if (n[2]) { d.start = n[2]; d.end = n[2]; }
  if (n[3]) d.end = n[3];
  return d;
}

// ─── Floor plan templates ────────────────────────────────────────────────────
type FloorType = "site" | "ground" | "typical" | "roof";

function getSiteRooms(lw: number, lh: number, sb: ReturnType<typeof parseSB>): Room[] {
  const fx = (sb.start / lw) * 100;
  const fy = (sb.front / lh) * 100;
  const fw = ((lw - sb.start - sb.end) / lw) * 100;
  const fh = ((lh - sb.front - sb.back) / lh) * 100;
  return [
    { id: "setback_front", x: 0, y: 0, w: 100, h: fy, label: `ارتداد أمامي ${sb.front}م`, labelEn: `Front Setback ${sb.front}m`, fill: C.setback, dashed: true, fontSize: 9 },
    { id: "setback_back", x: 0, y: fy + fh, w: 100, h: 100 - fy - fh, label: `ارتداد خلفي ${sb.back}م`, labelEn: `Back Setback ${sb.back}m`, fill: C.open, dashed: true, fontSize: 9 },
    { id: "setback_start", x: 0, y: fy, w: fx, h: fh, label: `${sb.start}م`, labelEn: `${sb.start}m`, fill: C.setback, dashed: true, fontSize: 8 },
    { id: "setback_end", x: fx + fw, y: fy, w: 100 - fx - fw, h: fh, label: `${sb.end}م`, labelEn: `${sb.end}m`, fill: C.setback, dashed: true, fontSize: 8 },
    { id: "building", x: fx, y: fy, w: fw, h: fh, label: "كتلة المبنى", labelEn: "Building Footprint", fill: C.unit, fontSize: 11 },
    { id: "parking_entry", x: fx + fw * 0.1, y: 0, w: fw * 0.3, h: fy, label: "مواقف", labelEn: "Parking", fill: C.parking, fontSize: 8 },
    { id: "entry_arrow", x: fx + fw * 0.4, y: 0, w: fw * 0.2, h: fy, label: "مدخل", labelEn: "Entry", fill: C.lobby, fontSize: 8 },
    { id: "garden", x: 0, y: fy + fh, w: 100, h: 100 - fy - fh, label: "تشجير وفراغات خارجية", labelEn: "Landscaping", fill: C.open, fontSize: 8 },
  ];
}

function getGroundRooms(type: string): Room[] {
  if (type === "villa") return [
    { id: "majlis", x: 0, y: 0, w: 45, h: 35, label: "مجلس", labelEn: "Majlis", fill: C.unit },
    { id: "entrance", x: 40, y: 0, w: 20, h: 15, label: "مدخل", labelEn: "Entrance", fill: C.lobby },
    { id: "dining", x: 55, y: 0, w: 45, h: 35, label: "سفرة", labelEn: "Dining", fill: C.unit },
    { id: "kitchen", x: 60, y: 35, w: 40, h: 35, label: "مطبخ", labelEn: "Kitchen", fill: C.service },
    { id: "living", x: 0, y: 35, w: 55, h: 35, label: "صالة", labelEn: "Living", fill: C.unit },
    { id: "stairs", x: 40, y: 15, w: 20, h: 20, label: "سلم", labelEn: "Stairs", fill: C.core },
    { id: "wc", x: 0, y: 70, w: 20, h: 30, label: "دورات مياه", labelEn: "WC", fill: C.service },
    { id: "laundry", x: 20, y: 70, w: 20, h: 30, label: "خدمات", labelEn: "Service", fill: C.service },
    { id: "garage", x: 40, y: 70, w: 60, h: 30, label: "كراج", labelEn: "Garage", fill: C.parking },
  ];
  return [
    { id: "lobby", x: 0, y: 0, w: 68, h: 28, label: "بهو ومدخل رئيسي", labelEn: "Main Lobby", fill: C.lobby },
    { id: "guard", x: 68, y: 0, w: 18, h: 28, label: "أمن", labelEn: "Guard", fill: C.service, fontSize: 8 },
    { id: "wc_g", x: 86, y: 0, w: 14, h: 28, label: "دورة\nمياه", labelEn: "WC", fill: C.service, fontSize: 7 },
    { id: "elev_a", x: 33, y: 28, w: 15, h: 22, label: "مصعد", labelEn: "Lift A", fill: C.core, fontSize: 7 },
    { id: "elev_b", x: 52, y: 28, w: 15, h: 22, label: "مصعد", labelEn: "Lift B", fill: C.core, fontSize: 7 },
    { id: "stair_l", x: 18, y: 28, w: 15, h: 32, label: "سلم", labelEn: "Stair", fill: C.core },
    { id: "stair_r", x: 67, y: 28, w: 15, h: 32, label: "سلم", labelEn: "Stair", fill: C.core },
    { id: "mail", x: 0, y: 28, w: 18, h: 20, label: "صناديق\nبريد", labelEn: "Mailboxes", fill: C.service, fontSize: 7 },
    { id: "bike", x: 0, y: 48, w: 18, h: 12, label: "دراجات", labelEn: "Bikes", fill: C.service, fontSize: 7 },
    { id: "mech", x: 82, y: 28, w: 18, h: 32, label: "غرفة\nتحكم", labelEn: "Mechanical", fill: C.service, fontSize: 8 },
    { id: "park1", x: 0, y: 62, w: 14, h: 38, label: "P", labelEn: "P", fill: C.parking, fontSize: 9 },
    { id: "park2", x: 16, y: 62, w: 14, h: 38, label: "P", labelEn: "P", fill: C.parking, fontSize: 9 },
    { id: "park3", x: 32, y: 62, w: 14, h: 38, label: "P", labelEn: "P", fill: C.parking, fontSize: 9 },
    { id: "park4", x: 48, y: 62, w: 14, h: 38, label: "P", labelEn: "P", fill: C.parking, fontSize: 9 },
    { id: "storage", x: 64, y: 62, w: 20, h: 38, label: "مخزن", labelEn: "Storage", fill: C.service },
    { id: "mech2", x: 84, y: 62, w: 16, h: 38, label: "ميكانيكا", labelEn: "Mech.", fill: C.service, fontSize: 8 },
  ];
}

function getTypicalRooms(type: string, optionIndex: number): Room[] {
  const coreBase = [
    { id: "elev_a", x: 37, y: 32, w: 12, h: 20, label: "مصعد", labelEn: "Lift A", fill: C.core, fontSize: 7 },
    { id: "elev_b", x: 51, y: 32, w: 12, h: 20, label: "مصعد", labelEn: "Lift B", fill: C.core, fontSize: 7 },
    { id: "stair_l", x: 22, y: 30, w: 13, h: 26, label: "سلم", labelEn: "Stair", fill: C.core },
    { id: "stair_r", x: 65, y: 30, w: 13, h: 26, label: "سلم", labelEn: "Stair", fill: C.core },
    { id: "corr_f", x: 37, y: 0, w: 26, h: 30, label: "ممر", labelEn: "Corridor", fill: C.open, fontSize: 8 },
    { id: "corr_b", x: 37, y: 56, w: 26, h: 44, label: "ممر", labelEn: "Corridor", fill: C.open, fontSize: 8 },
  ];

  if (type === "villa") return [
    { id: "master", x: 0, y: 0, w: 50, h: 50, label: "غرفة النوم الرئيسية", labelEn: "Master Bedroom", fill: C.unit },
    { id: "bed2", x: 50, y: 0, w: 50, h: 50, label: "غرفة نوم 2", labelEn: "Bedroom 2", fill: C.unit },
    { id: "bed3", x: 0, y: 50, w: 50, h: 50, label: "غرفة نوم 3", labelEn: "Bedroom 3", fill: C.unit },
    { id: "family", x: 50, y: 50, w: 50, h: 50, label: "صالة عائلية", labelEn: "Family Room", fill: C.lobby },
  ];

  if (optionIndex === 1) { // modern luxury - 2 large units
    return [...coreBase,
      { id: "unit_a", x: 0, y: 0, w: 37, h: 100, label: "وحدة A\n(مودرن فاخر)", labelEn: "Unit A\nModern Luxury", fill: C.unit },
      { id: "unit_b", x: 63, y: 0, w: 37, h: 100, label: "وحدة B\n(مودرن فاخر)", labelEn: "Unit B\nModern Luxury", fill: C.unit },
    ];
  }
  if (optionIndex === 2) { // investment - 6 units
    return [
      { id: "u1", x: 0, y: 0, w: 38, h: 33, label: "وحدة 1", labelEn: "Unit 1", fill: C.unit, fontSize: 8 },
      { id: "u2", x: 62, y: 0, w: 38, h: 33, label: "وحدة 2", labelEn: "Unit 2", fill: C.unit, fontSize: 8 },
      { id: "u3", x: 0, y: 33, w: 38, h: 34, label: "وحدة 3", labelEn: "Unit 3", fill: C.unit, fontSize: 8 },
      { id: "u4", x: 62, y: 33, w: 38, h: 34, label: "وحدة 4", labelEn: "Unit 4", fill: C.unit, fontSize: 8 },
      { id: "u5", x: 0, y: 67, w: 38, h: 33, label: "وحدة 5", labelEn: "Unit 5", fill: C.unit, fontSize: 8 },
      { id: "u6", x: 62, y: 67, w: 38, h: 33, label: "وحدة 6", labelEn: "Unit 6", fill: C.unit, fontSize: 8 },
      { id: "core_inv", x: 38, y: 28, w: 24, h: 44, label: "نواة\nخدمات", labelEn: "Core", fill: C.core, fontSize: 8 },
      { id: "corr_inv_t", x: 38, y: 0, w: 24, h: 28, label: "", labelEn: "", fill: C.open, fontSize: 7 },
      { id: "corr_inv_b", x: 38, y: 72, w: 24, h: 28, label: "", labelEn: "", fill: C.open, fontSize: 7 },
    ];
  }
  // option 0 - economic: 4 units
  return [...coreBase,
    { id: "unit_a", x: 0, y: 0, w: 37, h: 50, label: "وحدة A", labelEn: "Unit A", fill: C.unit },
    { id: "unit_b", x: 63, y: 0, w: 37, h: 50, label: "وحدة B", labelEn: "Unit B", fill: C.unit },
    { id: "unit_c", x: 0, y: 56, w: 37, h: 44, label: "وحدة C", labelEn: "Unit C", fill: C.unit },
    { id: "unit_d", x: 63, y: 56, w: 37, h: 44, label: "وحدة D", labelEn: "Unit D", fill: C.unit },
  ];
}

function getRoofRooms(): Room[] {
  return [
    { id: "tank_l", x: 0, y: 0, w: 25, h: 30, label: "خزانات\nمياه", labelEn: "Water\nTanks", fill: C.service, fontSize: 8 },
    { id: "elev_room", x: 38, y: 0, w: 24, h: 30, label: "غرفة\nمصعد", labelEn: "Lift\nRoom", fill: C.core, fontSize: 8 },
    { id: "tank_r", x: 75, y: 0, w: 25, h: 30, label: "خزانات\nمياه", labelEn: "Water\nTanks", fill: C.service, fontSize: 8 },
    { id: "gen", x: 0, y: 32, w: 20, h: 28, label: "مولّد\nكهربائي", labelEn: "Generator", fill: C.service, fontSize: 7 },
    { id: "solar", x: 22, y: 32, w: 20, h: 28, label: "ألواح\nشمسية", labelEn: "Solar\nPanels", fill: C.setback, fontSize: 7 },
    { id: "terrace", x: 44, y: 32, w: 56, h: 28, label: "تراس\nمفتوح", labelEn: "Open\nTerrace", fill: C.open, fontSize: 8 },
    { id: "pergola", x: 20, y: 62, w: 60, h: 38, label: "برجولة وجلسات", labelEn: "Pergola & Seating", fill: C.open },
  ];
}

// ─── SVG drawing helper ──────────────────────────────────────────────────────
const CANVAS_W = 780;
const CANVAS_H = 580;
const MARGIN = { top: 60, right: 40, bottom: 70, left: 80 };
const BW = CANVAS_W - MARGIN.left - MARGIN.right;
const BH = CANVAS_H - MARGIN.top - MARGIN.bottom;

function NorthArrow({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r={18} fill="white" stroke={C.wall} strokeWidth={1} />
      <polygon points="0,-14 4,8 0,4 -4,8" fill={C.wall} />
      <polygon points="0,-14 4,8 0,4" fill="white" opacity={0.6} />
      <text y={26} textAnchor="middle" fontSize={10} fill={C.wall} fontWeight="600" fontFamily="sans-serif">N</text>
    </g>
  );
}

function ScaleBar({ x, y, metersPerPx }: { x: number; y: number; metersPerPx: number }) {
  const barM = metersPerPx > 0 ? Math.round(BW / 4 * metersPerPx / 5) * 5 : 10;
  const barPx = barM / metersPerPx;
  return (
    <g transform={`translate(${x},${y})`}>
      <line x1={0} y1={0} x2={barPx} y2={0} stroke={C.wall} strokeWidth={2} />
      <line x1={0} y1={-5} x2={0} y2={5} stroke={C.wall} strokeWidth={2} />
      <line x1={barPx} y1={-5} x2={barPx} y2={5} stroke={C.wall} strokeWidth={2} />
      <text x={barPx / 2} y={-8} textAnchor="middle" fontSize={9} fill={C.dim} fontFamily="sans-serif">
        {barM}م
      </text>
      <text x={0} y={14} textAnchor="middle" fontSize={8} fill={C.dim} fontFamily="sans-serif">0</text>
      <text x={barPx} y={14} textAnchor="middle" fontSize={8} fill={C.dim} fontFamily="sans-serif">{barM}م</text>
    </g>
  );
}

function PlanSVG({
  rooms, bldgW, bldgH, title, subtitle, showStreet, svgRef,
}: {
  rooms: Room[];
  bldgW: number; bldgH: number;
  title: string; subtitle: string;
  showStreet?: boolean;
  svgRef?: React.RefObject<SVGSVGElement | null>;
}) {
  const scaleX = BW / bldgW;
  const scaleY = BH / bldgH;
  const sc = Math.min(scaleX, scaleY);
  const offsetX = MARGIN.left + (BW - bldgW * sc) / 2;
  const offsetY = MARGIN.top + (BH - bldgH * sc) / 2;
  const metersPerPx = 1 / sc;

  const rx = (pct: number) => offsetX + (pct / 100) * bldgW * sc;
  const ry = (pct: number) => offsetY + (pct / 100) * bldgH * sc;
  const rw = (pct: number) => (pct / 100) * bldgW * sc;
  const rh = (pct: number) => (pct / 100) * bldgH * sc;

  // Grid lines every 5m
  const gridCols = Math.floor(bldgW / 5);
  const gridRows = Math.floor(bldgH / 5);

  return (
    <svg
      ref={svgRef as React.RefObject<SVGSVGElement>}
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      className="w-full h-full"
      style={{ background: "white", fontFamily: "system-ui, sans-serif" }}
    >
      {/* Title */}
      <text x={CANVAS_W / 2} y={22} textAnchor="middle" fontSize={14} fontWeight="700" fill={C.wall}>{title}</text>
      <text x={CANVAS_W / 2} y={40} textAnchor="middle" fontSize={9} fill={C.dim}>{subtitle}</text>

      {/* Grid lines */}
      {Array.from({ length: gridCols - 1 }, (_, i) => (
        <line key={`vg${i}`}
          x1={offsetX + (i + 1) * 5 * sc} y1={offsetY}
          x2={offsetX + (i + 1) * 5 * sc} y2={offsetY + bldgH * sc}
          stroke={C.grid} strokeWidth={0.5} strokeDasharray="3 5" />
      ))}
      {Array.from({ length: gridRows - 1 }, (_, i) => (
        <line key={`hg${i}`}
          x1={offsetX} y1={offsetY + (i + 1) * 5 * sc}
          x2={offsetX + bldgW * sc} y2={offsetY + (i + 1) * 5 * sc}
          stroke={C.grid} strokeWidth={0.5} strokeDasharray="3 5" />
      ))}

      {/* Rooms */}
      {rooms.map((room) => {
        const x = rx(room.x); const y = ry(room.y);
        const w = rw(room.w); const h = rh(room.h);
        const cx = x + w / 2; const cy = y + h / 2;
        const fz = Math.max(Math.min(room.fontSize ?? 10, Math.min(w, h) / 4), 7);
        const lines = room.label.split("\n");
        return (
          <g key={room.id}>
            <rect x={x} y={y} width={w} height={h}
              fill={room.fill} stroke={C.wall} strokeWidth={1.5}
              strokeDasharray={room.dashed ? "4 3" : undefined} />
            {lines.map((line, li) => (
              <text key={li}
                x={cx} y={cy + (li - (lines.length - 1) / 2) * (fz + 1)}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={fz} fill={C.label} fontWeight="500">
                {line}
              </text>
            ))}
          </g>
        );
      })}

      {/* Structural column dots (every 5m) */}
      {Array.from({ length: gridCols + 1 }, (_, ci) =>
        Array.from({ length: gridRows + 1 }, (_, ri) => (
          <circle key={`c${ci}-${ri}`}
            cx={offsetX + ci * 5 * sc} cy={offsetY + ri * 5 * sc}
            r={3} fill={C.wall} />
        ))
      )}

      {/* Dimension annotations */}
      {/* Width */}
      <line x1={offsetX} y1={offsetY + bldgH * sc + 25} x2={offsetX + bldgW * sc} y2={offsetY + bldgH * sc + 25} stroke={C.dim} strokeWidth={1} />
      <line x1={offsetX} y1={offsetY + bldgH * sc + 20} x2={offsetX} y2={offsetY + bldgH * sc + 30} stroke={C.dim} strokeWidth={1} />
      <line x1={offsetX + bldgW * sc} y1={offsetY + bldgH * sc + 20} x2={offsetX + bldgW * sc} y2={offsetY + bldgH * sc + 30} stroke={C.dim} strokeWidth={1} />
      <text x={(offsetX + offsetX + bldgW * sc) / 2} y={offsetY + bldgH * sc + 40} textAnchor="middle" fontSize={10} fill={C.dim}>{bldgW}م</text>
      {/* Height */}
      <line x1={offsetX - 25} y1={offsetY} x2={offsetX - 25} y2={offsetY + bldgH * sc} stroke={C.dim} strokeWidth={1} />
      <line x1={offsetX - 30} y1={offsetY} x2={offsetX - 20} y2={offsetY} stroke={C.dim} strokeWidth={1} />
      <line x1={offsetX - 30} y1={offsetY + bldgH * sc} x2={offsetX - 20} y2={offsetY + bldgH * sc} stroke={C.dim} strokeWidth={1} />
      <text x={offsetX - 38} y={(offsetY + offsetY + bldgH * sc) / 2} textAnchor="middle" fontSize={10} fill={C.dim} transform={`rotate(-90, ${offsetX - 38}, ${(offsetY + offsetY + bldgH * sc) / 2})`}>{bldgH}م</text>

      {/* Street label */}
      {showStreet && (
        <text x={CANVAS_W / 2} y={CANVAS_H - 16} textAnchor="middle" fontSize={11} fill={C.dim} fontWeight="600">
          ← الشارع →
        </text>
      )}

      {/* North arrow */}
      <NorthArrow x={CANVAS_W - 38} y={MARGIN.top + 22} />

      {/* Scale bar */}
      <ScaleBar x={offsetX} y={CANVAS_H - 16} metersPerPx={metersPerPx} />
    </svg>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export type FloorTab = "site" | "ground" | "typical" | "roof";

export function FloorPlanView({ brief, report }: { brief: ProjectBrief; report: ArchitectReport }) {
  const { t, locale } = useI18n();
  const fp = t.architectAi.floorplan;
  const [optionIdx, setOptionIdx] = useState(0);
  const [floorTab, setFloorTab] = useState<FloorTab>("site");
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const dims = parseDims(brief.dimensions, brief.landArea);
  const sb = parseSB(brief.setbacks);
  const bldgW = dims.w - sb.start - sb.end;
  const bldgH = dims.h - sb.front - sb.back;

  const rooms = floorTab === "site"
    ? getSiteRooms(dims.w, dims.h, sb)
    : floorTab === "ground"
    ? getGroundRooms(brief.projectType)
    : floorTab === "typical"
    ? getTypicalRooms(brief.projectType, optionIdx)
    : getRoofRooms();

  const usedW = floorTab === "site" ? dims.w : bldgW;
  const usedH = floorTab === "site" ? dims.h : bldgH;

  const floorTitle = locale === "ar"
    ? fp.floor_tabs[floorTab]
    : { site: "Site Plan", ground: "Ground Floor", typical: "Typical Floor", roof: "Roof Plan" }[floorTab];

  const optLabel = locale === "ar"
    ? fp.option_labels[optionIdx]
    : ["Economic Option", "Modern Luxury Option", "Investment Option"][optionIdx];

  const downloadSvg = useCallback(() => {
    if (!svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([xml], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `floor-plan-${floorTab}.svg`; a.click();
    URL.revokeObjectURL(url);
  }, [floorTab]);

  const downloadPng = useCallback(() => {
    if (!svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    const img = new Image();
    const blob = new Blob([xml], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1560; canvas.height = 1160;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, 1560, 1160);
      canvas.toBlob((b) => {
        if (!b) return;
        const link = document.createElement("a");
        link.href = URL.createObjectURL(b);
        link.download = `floor-plan-${floorTab}.png`; link.click();
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [floorTab]);

  const tabBtn = (tab: FloorTab, label: string) => (
    <button key={tab} onClick={() => setFloorTab(tab)}
      className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
        floorTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Option selector */}
      <div className="flex flex-wrap gap-2">
        {fp.option_labels.map((label, i) => (
          <button key={i} onClick={() => setOptionIdx(i)}
            className={cn("rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
              optionIdx === i ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
            {label}
          </button>
        ))}
      </div>

      {/* Floor tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/30 p-1">
        {tabBtn("site", fp.floor_tabs.site)}
        {tabBtn("ground", fp.floor_tabs.ground)}
        {tabBtn("typical", fp.floor_tabs.typical)}
        {tabBtn("roof", fp.floor_tabs.roof)}
      </div>

      {/* SVG plan */}
      <div className="mnc-card overflow-hidden p-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="text-xs font-semibold text-muted-foreground">{floorTitle} — {optLabel}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom(z => Math.min(z + 0.25, 3))} title={fp.zoom_in}
              className="grid size-7 place-items-center rounded-md hover:bg-accent"><ZoomIn className="size-3.5" /></button>
            <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} title={fp.zoom_out}
              className="grid size-7 place-items-center rounded-md hover:bg-accent"><ZoomOut className="size-3.5" /></button>
            <button onClick={() => setZoom(1)} title={fp.reset_zoom}
              className="grid size-7 place-items-center rounded-md hover:bg-accent"><RotateCcw className="size-3.5" /></button>
            <div className="mx-1 h-4 w-px bg-border" />
            <button onClick={downloadSvg} title={fp.download_svg}
              className="grid size-7 place-items-center rounded-md hover:bg-accent"><Download className="size-3.5" /></button>
            <button onClick={downloadPng} title={fp.download_png}
              className="grid size-7 place-items-center rounded-md hover:bg-accent"><Maximize2 className="size-3.5" /></button>
            <button onClick={() => window.print()} title="Print"
              className="grid size-7 place-items-center rounded-md hover:bg-accent"><Printer className="size-3.5" /></button>
          </div>
        </div>

        {/* SVG canvas */}
        <div className="overflow-auto bg-white" style={{ maxHeight: 560 }}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", transition: "transform .2s" }}>
            <PlanSVG
              rooms={rooms}
              bldgW={usedW} bldgH={usedH}
              title={floorTitle}
              subtitle={`${optLabel} · ${brief.city}${brief.district ? "، " + brief.district : ""}`}
              showStreet={floorTab === "site"}
              svgRef={svgRef}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-2">
          {[
            { fill: C.unit, label: locale === "ar" ? "وحدات سكنية" : "Residential Units" },
            { fill: C.lobby, label: locale === "ar" ? "بهو ومداخل" : "Lobby/Entrance" },
            { fill: C.core, label: locale === "ar" ? "نواة (مصعد/سلم)" : "Core (Lift/Stair)" },
            { fill: C.service, label: locale === "ar" ? "خدمات" : "Services" },
            { fill: C.parking, label: locale === "ar" ? "مواقف" : "Parking" },
            { fill: C.open, label: locale === "ar" ? "مفتوح/حديقة" : "Open/Garden" },
          ].map(({ fill, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="size-3 rounded-sm border border-border" style={{ background: fill }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Legal notice */}
      <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-muted-foreground">
        ⚠️ {fp.legal}
      </p>
    </div>
  );
}
