"use client";

import { useState } from "react";
import { RotateCcw, Download } from "lucide-react";
import type { ProjectBrief, ArchitectReport } from "@/lib/domain/types";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type ViewMode = "perspective" | "top" | "front" | "side";

// ─── Isometric projection helpers ────────────────────────────────────────────
const cos30 = Math.cos(Math.PI / 6);
const sin30 = Math.sin(Math.PI / 6);

function iso(bx: number, by: number, bz: number, sc: number): [number, number] {
  return [(bx - by) * cos30 * sc, -(bx + by) * sin30 * sc + bz * sc];
}

// ─── Face drawing helpers ────────────────────────────────────────────────────
function pts(points: [number, number][]): string {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

// ─── Main component ──────────────────────────────────────────────────────────
export function MassingView({ brief, report }: { brief: ProjectBrief; report: ArchitectReport }) {
  const { t, locale } = useI18n();
  const m3 = t.architectAi.model3d;
  const [view, setView] = useState<ViewMode>("perspective");

  // Building dimensions
  const dims = parseDims(brief.dimensions, brief.landArea);
  const sb = parseSB(brief.setbacks);
  const bW = Math.max(dims.w - sb.start - sb.end, 8);
  const bD = Math.max(dims.h - sb.front - sb.back, 8);
  const floors = brief.floors ?? 4;
  const floorH = 3.5;
  const bH = floors * floorH;

  const CANVAS_W = 700;
  const CANVAS_H = 500;
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2 + 40;

  function renderPerspective() {
    const sc = Math.min(340 / (bW + bD), 280 / (bW + bD + bH)) * 0.8;

    function p(x: number, y: number, z: number): [number, number] {
      const [ix, iy] = iso(x, y, z, sc);
      return [cx + ix, cy + iy];
    }

    // Base corners
    const A = p(0, 0, 0); const B = p(bW, 0, 0);
    const C_ = p(bW, bD, 0); const D = p(0, bD, 0);
    // Top corners
    const At = p(0, 0, bH); const Bt = p(bW, 0, bH);
    const Ct = p(bW, bD, bH); const Dt = p(0, bD, bH);

    // Floor lines on front face (y=0)
    const floorLinesFront = Array.from({ length: floors - 1 }, (_, i) => {
      const z = (i + 1) * floorH;
      return [p(0, 0, z), p(bW, 0, z)] as [[number, number], [number, number]];
    });
    // Floor lines on right face (x=bW)
    const floorLinesRight = Array.from({ length: floors - 1 }, (_, i) => {
      const z = (i + 1) * floorH;
      return [p(bW, 0, z), p(bW, bD, z)] as [[number, number], [number, number]];
    });

    // Window grid on front face
    const winCols = Math.max(2, Math.floor(bW / 3));
    const windowsFront: Array<{ x: number; y: number; w: number; h: number }> = [];
    for (let fl = 0; fl < floors; fl++) {
      for (let wc = 0; wc < winCols; wc++) {
        const wx = (wc + 0.5) / winCols;
        const wz = (fl + 0.35) / floors;
        const [wpx, wpy] = p(wx * bW, 0, wz * bH);
        windowsFront.push({ x: wpx - 4, y: wpy - 5, w: 8, h: 10 });
      }
    }

    // Window grid on right face
    const winColsR = Math.max(2, Math.floor(bD / 3));
    const windowsRight: Array<{ x: number; y: number; w: number; h: number }> = [];
    for (let fl = 0; fl < floors; fl++) {
      for (let wc = 0; wc < winColsR; wc++) {
        const wy = (wc + 0.5) / winColsR;
        const wz = (fl + 0.35) / floors;
        const [wpx, wpy] = p(bW, wy * bD, wz * bH);
        windowsRight.push({ x: wpx - 3, y: wpy - 4, w: 6, h: 8 });
      }
    }

    // Land base (with setbacks)
    const landSc = sc;
    const landW = dims.w;
    const landD = dims.h;
    const lA = p(-sb.start, -sb.front, 0); const lB = p(landW - sb.start, -sb.front, 0);
    const lC = p(landW - sb.start, landD - sb.front, 0); const lD = p(-sb.start, landD - sb.front, 0);

    return (
      <g>
        {/* Land base */}
        <polygon points={pts([lA, lB, lC, lD])} fill="#E8E4DC" stroke="#999" strokeWidth={0.5} opacity={0.6} />
        {/* Setback region (dashed outline of building footprint) */}
        <polygon points={pts([A, B, C_, D])} fill="none" stroke="#C9A24B" strokeWidth={1} strokeDasharray="4 3" />

        {/* Building faces */}
        {/* Bottom: hidden */}
        {/* Left face (y=bD): hidden in this view */}
        {/* Back face (y=bD): hidden */}
        {/* Right face (x=bW) */}
        <polygon points={pts([B, C_, Ct, Bt])} fill="#D0D8E0" stroke="#888" strokeWidth={1} />
        {floorLinesRight.map(([l1, l2], i) => (
          <line key={`flr${i}`} x1={l1[0]} y1={l1[1]} x2={l2[0]} y2={l2[1]} stroke="#888" strokeWidth={0.8} />
        ))}
        {windowsRight.map((w, i) => (
          <rect key={`wr${i}`} x={w.x} y={w.y} width={w.w} height={w.h} fill="#87CEEB" opacity={0.7} rx={1} />
        ))}

        {/* Front face (y=0) */}
        <polygon points={pts([A, B, Bt, At])} fill="#F0F0F0" stroke="#888" strokeWidth={1} />
        {floorLinesFront.map(([l1, l2], i) => (
          <line key={`flf${i}`} x1={l1[0]} y1={l1[1]} x2={l2[0]} y2={l2[1]} stroke="#888" strokeWidth={0.8} />
        ))}
        {windowsFront.map((w, i) => (
          <rect key={`wf${i}`} x={w.x} y={w.y} width={w.w} height={w.h} fill="#87CEEB" opacity={0.7} rx={1} />
        ))}

        {/* Top face */}
        <polygon points={pts([At, Bt, Ct, Dt])} fill="#C9A24B" opacity={0.4} stroke="#888" strokeWidth={1} />
        {/* Parapet walls */}
        <polygon points={pts([At, Bt, Ct, Dt])} fill="none" stroke="#C9A24B" strokeWidth={1.5} />

        {/* Floor count label */}
        <text x={cx} y={cy - bH * sc - 15} textAnchor="middle" fontSize={11} fill="#333" fontFamily="sans-serif">
          {floors} {locale === "ar" ? "أدوار" : "Floors"} · {Math.round(bH)}م
        </text>
        {/* Width label */}
        {(() => { const ml = p(bW / 2, 0, 0); return <text x={ml[0]} y={ml[1] + 14} textAnchor="middle" fontSize={9} fill="#666" fontFamily="sans-serif">{bW}م</text>; })()}
        {/* Depth label */}
        {(() => { const ml = p(bW, bD / 2, 0); return <text x={ml[0] + 8} y={ml[1]} textAnchor="start" fontSize={9} fill="#666" fontFamily="sans-serif">{bD}م</text>; })()}
      </g>
    );
  }

  function renderTop() {
    const maxDim = Math.max(dims.w, dims.h);
    const sc = Math.min(CANVAS_W, CANVAS_H) * 0.65 / maxDim;
    const ox = (CANVAS_W - dims.w * sc) / 2;
    const oy = (CANVAS_H - dims.h * sc) / 2;
    return (
      <g>
        <rect x={ox} y={oy} width={dims.w * sc} height={dims.h * sc} fill="#E8E4DC" stroke="#888" strokeWidth={1} />
        <rect x={ox + sb.start * sc} y={oy + sb.front * sc}
          width={(dims.w - sb.start - sb.end) * sc} height={(dims.h - sb.front - sb.back) * sc}
          fill="#D0D0D0" stroke="#333" strokeWidth={1.5} />
        <text x={CANVAS_W / 2} y={CANVAS_H - 20} textAnchor="middle" fontSize={10} fill="#555" fontFamily="sans-serif">
          {locale === "ar" ? "المسقط الأفقي" : "Top View"} — {dims.w}م × {dims.h}م
        </text>
        {/* North indicator */}
        <text x={CANVAS_W - 30} y={40} textAnchor="middle" fontSize={22} fill="#C9A24B">↑</text>
        <text x={CANVAS_W - 30} y={56} textAnchor="middle" fontSize={9} fill="#555" fontFamily="sans-serif">N</text>
      </g>
    );
  }

  function renderElevation(isSide: boolean) {
    const w = isSide ? bD : bW;
    const sc = Math.min((CANVAS_W - 80) / w, (CANVAS_H - 80) / bH);
    const ox = (CANVAS_W - w * sc) / 2;
    const oy = CANVAS_H - 40 - bH * sc;
    const floorH_px = floorH * sc;
    return (
      <g>
        {/* Ground line */}
        <line x1={ox - 20} y1={oy + bH * sc} x2={ox + w * sc + 20} y2={oy + bH * sc} stroke="#555" strokeWidth={1.5} />
        {/* Building outline */}
        <rect x={ox} y={oy} width={w * sc} height={bH * sc} fill="white" stroke="#1A1A1A" strokeWidth={2} />
        {/* Floor lines */}
        {Array.from({ length: floors - 1 }, (_, i) => (
          <line key={i} x1={ox} y1={oy + bH * sc - (i + 1) * floorH_px}
            x2={ox + w * sc} y2={oy + bH * sc - (i + 1) * floorH_px}
            stroke="#555" strokeWidth={0.8} strokeDasharray="4 3" />
        ))}
        {/* Windows */}
        {Array.from({ length: floors }, (_, fl) =>
          Array.from({ length: Math.max(2, Math.floor(w / 3)) }, (_, wc) => {
            const winW = Math.min(floorH_px * 0.7, w * sc / Math.floor(w / 3) * 0.4);
            const winH = floorH_px * 0.45;
            const gapX = w * sc / Math.floor(w / 3);
            const baseZ = bH * sc - (fl + 1) * floorH_px;
            return (
              <rect key={`w${fl}-${wc}`}
                x={ox + gapX * wc + gapX * 0.3}
                y={oy + baseZ + floorH_px * 0.25}
                width={winW} height={winH}
                fill="#87CEEB" opacity={0.8} rx={1} stroke="#aaa" strokeWidth={0.5} />
            );
          })
        )}
        {/* Floor level labels */}
        {Array.from({ length: floors }, (_, i) => (
          <text key={i} x={ox - 5} y={oy + bH * sc - (i + 0.5) * floorH_px}
            textAnchor="end" dominantBaseline="middle" fontSize={8} fill="#555" fontFamily="sans-serif">
            {locale === "ar" ? `د${i + 1}` : `F${i + 1}`}
          </text>
        ))}
        <text x={CANVAS_W / 2} y={CANVAS_H - 10} textAnchor="middle" fontSize={10} fill="#555" fontFamily="sans-serif">
          {isSide ? (locale === "ar" ? "واجهة جانبية" : "Side Elevation") : (locale === "ar" ? "الواجهة الأمامية" : "Front Elevation")}
          {" — "}بعرض {Math.round(w)}م وارتفاع {Math.round(bH)}م
        </text>
      </g>
    );
  }

  const viewLabels: Record<ViewMode, string> = {
    perspective: locale === "ar" ? m3.views.perspective : "Perspective",
    top:         locale === "ar" ? m3.views.top : "Top View",
    front:       locale === "ar" ? m3.views.front : "Front View",
    side:        locale === "ar" ? m3.views.side : "Side View",
  };

  return (
    <div className="space-y-4">
      {/* View controls */}
      <div className="flex flex-wrap items-center gap-2">
        {(["perspective", "top", "front", "side"] as ViewMode[]).map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              view === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
            {viewLabels[v]}
          </button>
        ))}
        <button onClick={() => setView("perspective")}
          className="ms-auto flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent">
          <RotateCcw className="size-3" /> {locale === "ar" ? m3.reset_view : "Reset View"}
        </button>
      </div>

      {/* 3D canvas */}
      <div className="mnc-card overflow-hidden p-0">
        <svg viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} className="w-full" style={{ background: "#F8F6F2", maxHeight: 500 }}>
          {/* Grid floor */}
          {Array.from({ length: 20 }, (_, i) => (
            <line key={`fg${i}`} x1={0} y1={CANVAS_H - 40 + i * 8} x2={CANVAS_W} y2={CANVAS_H - 40 + i * 8}
              stroke="#E0D8CE" strokeWidth={0.5} />
          ))}
          {view === "perspective" && renderPerspective()}
          {view === "top" && renderTop()}
          {view === "front" && renderElevation(false)}
          {view === "side" && renderElevation(true)}

          {/* Info label */}
          <text x={12} y={18} fontSize={9} fill="#888" fontFamily="sans-serif">
            {brief.city}{brief.district ? "، " + brief.district : ""} · {brief.landArea}م² · {floors} {locale === "ar" ? "أدوار" : "floors"}
          </text>
        </svg>
      </div>

      {/* Legal */}
      <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-muted-foreground">
        ⚠️ {locale === "ar" ? m3.legal : "Preliminary massing model for conceptual visualization only."}
      </p>
    </div>
  );
}

// ─── Helpers (duplicated from floor-plan-view to keep component self-contained) ──
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
