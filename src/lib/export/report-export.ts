"use client";

import type { ArchitectReport, Project } from "@/lib/domain/types";

/* ============================================================
 * MNC Architect — Report Export Center
 * يدعم: Word (.docx) · PDF (طباعة) · JSON · Excel (.xlsx)
 * جميع الملفات تحافظ على هوية MNC.
 * ============================================================ */

const GOLD = "C9A24B";
const NAVY = "0C2138";

function fileBase(project: Project) {
  return `MNC-${project.name}`.replace(/[^\u0600-\u06FF\w-]+/g, "_");
}

/* ---------------------- Word (.docx) ---------------------- */
export async function exportReportWord(project: Project, report: ArchitectReport) {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
  } = await import("docx");
  const { saveAs } = await import("file-saver");

  const rtl = true;
  const H = (text: string) =>
    new Paragraph({
      bidirectional: rtl,
      alignment: AlignmentType.RIGHT,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text, rightToLeft: rtl, color: NAVY, bold: true, size: 26 })],
    });
  const P = (text: string) =>
    new Paragraph({
      bidirectional: rtl,
      alignment: AlignmentType.RIGHT,
      spacing: { after: 100 },
      children: [new TextRun({ text, rightToLeft: rtl, size: 22 })],
    });
  const Bullet = (text: string) =>
    new Paragraph({
      bidirectional: rtl,
      alignment: AlignmentType.RIGHT,
      bullet: { level: 0 },
      children: [new TextRun({ text, rightToLeft: rtl, size: 22 })],
    });

  const cell = (text: string, header = false) =>
    new TableCell({
      width: { size: 25, type: WidthType.PERCENTAGE },
      shading: header ? { fill: NAVY } : undefined,
      children: [
        new Paragraph({
          bidirectional: rtl,
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text, rightToLeft: rtl, bold: header, color: header ? "FFFFFF" : "000000", size: 20 })],
        }),
      ],
    });

  const areaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [cell("البند", true), cell("المساحة (م²)", true), cell("العدد", true), cell("ملاحظات", true)],
      }),
      ...report.areaTable.map(
        (r) =>
          new TableRow({
            children: [cell(r.label), cell(String(r.area)), cell(r.count ? String(r.count) : "-"), cell(r.notes ?? "-")],
          }),
      ),
    ],
  });

  const sar = (n: number) => `${Math.round(n).toLocaleString("en-US")} ريال`;

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial" } } } },
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [new TextRun({ text: "MNC ARCHITECT AI", bold: true, color: GOLD, size: 40 })],
          }),
          new Paragraph({
            bidirectional: rtl,
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [new TextRun({ text: `تقرير معماري — ${project.name}`, rightToLeft: rtl, color: NAVY, bold: true, size: 30 })],
          }),
          P(`العميل: ${project.client}`),
          P(`الموقع: ${project.brief.city} — ${project.brief.district}`),

          H("1. ملخص المشروع"),
          P(report.summary),
          H("2. الافتراضات"),
          ...report.assumptions.map(Bullet),
          H("3. تحليل الأرض"),
          P(report.siteAnalysis),
          H("4. أفضل فكرة تصميمية"),
          P(report.bestConcept),
          H("5. الخيارات التصميمية"),
          ...report.options.flatMap((o) => [
            new Paragraph({
              bidirectional: rtl,
              alignment: AlignmentType.RIGHT,
              spacing: { before: 80 },
              children: [new TextRun({ text: `• ${o.title}`, rightToLeft: rtl, bold: true, color: GOLD, size: 22 })],
            }),
            P(o.description),
          ]),
          H("6. جدول المساحات"),
          areaTable,
          H("7. وصف المخطط"),
          Bullet(`الموقع العام: ${report.planDescription.site}`),
          Bullet(`الدور الأرضي: ${report.planDescription.groundFloor}`),
          Bullet(`الأدوار المتكررة: ${report.planDescription.typicalFloors}`),
          Bullet(`السطح: ${report.planDescription.roof}`),
          Bullet(`المواقف: ${report.planDescription.parking}`),
          H("8. الواجهات والمواد"),
          P(report.facade),
          H("9. التكلفة التقديرية"),
          P(`سعر المتر: ${sar(report.estimatedCost.perSqm)} | إجمالي المسطحات: ${report.estimatedCost.totalBuiltUp.toLocaleString("en-US")} م²`),
          P(`الإجمالي: ${sar(report.estimatedCost.total)}`),
          H("10. الإيرادات المتوقعة"),
          P(`${sar(report.expectedRevenue.total)}${report.expectedRevenue.note ? ` — ${report.expectedRevenue.note}` : ""}`),
          H("11. صافي الربح"),
          P(sar(report.netProfit)),
          H("12. العائد الاستثماري (ROI)"),
          P(`${report.roi}%`),
          H("13. فترة الاسترداد"),
          P(`${report.paybackYears} سنة`),
          H("14. الهندسة القيمية"),
          ...report.valueEngineering.map(Bullet),
          H("15. برومبت الصورة الواقعية"),
          new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: report.imagePrompt, size: 20, italics: true })] }),
          H("16. التوصية النهائية"),
          P(report.recommendation),

          new Paragraph({
            bidirectional: rtl,
            alignment: AlignmentType.CENTER,
            spacing: { before: 360 },
            children: [new TextRun({ text: "© MNC Group — مروان ناظر للاستشارات الهندسية", rightToLeft: rtl, color: "888888", size: 18 })],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileBase(project)}.docx`);
}

/* ---------------------- PDF (طباعة احترافية) ---------------------- */
export function exportReportPdf(project: Project, report: ArchitectReport) {
  const sar = (n: number) => `${Math.round(n).toLocaleString("en-US")} ريال`;
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) return;

  const rows = report.areaTable
    .map(
      (r) =>
        `<tr><td>${r.label}</td><td>${r.area.toLocaleString()}</td><td>${r.count ?? "-"}</td><td>${r.notes ?? "-"}</td></tr>`,
    )
    .join("");

  const options = report.options
    .map((o) => `<div class="opt"><b>${o.title}</b><p>${o.description}</p></div>`)
    .join("");

  const li = (arr: string[]) => `<ul>${arr.map((x) => `<li>${x}</li>`).join("")}</ul>`;

  w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">
  <title>${fileBase(project)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap');
    * { box-sizing: border-box; }
    body { font-family: 'IBM Plex Sans Arabic', Arial, sans-serif; color:#102A45; margin:0; padding:40px; line-height:1.7; }
    .brand { text-align:center; border-bottom:3px solid #C9A24B; padding-bottom:16px; margin-bottom:8px; }
    .brand .logo { font-weight:800; letter-spacing:2px; color:#C9A24B; font-size:28px; }
    .brand .sub { color:#0C2138; font-weight:700; font-size:20px; margin-top:4px; }
    .meta { color:#5b6b7b; font-size:13px; text-align:center; margin-bottom:24px; }
    h2 { color:#0C2138; font-size:17px; border-right:4px solid #C9A24B; padding:4px 12px 4px 0; margin:22px 0 8px; }
    p { margin:6px 0; font-size:14px; }
    ul { margin:6px 24px; font-size:14px; }
    .opt { background:#FBF7EF; border:1px solid #E2C879; border-radius:8px; padding:10px 14px; margin:8px 0; }
    .opt b { color:#9C7A30; }
    table { width:100%; border-collapse:collapse; margin:8px 0; font-size:13px; }
    th { background:#0C2138; color:#fff; padding:8px; }
    td { border:1px solid #ddd; padding:7px; text-align:center; }
    .kpis { display:flex; gap:10px; flex-wrap:wrap; margin:10px 0; }
    .kpi { flex:1; min-width:120px; background:#0C2138; color:#fff; border-radius:10px; padding:12px; text-align:center; }
    .kpi .v { color:#E2C879; font-weight:800; font-size:18px; }
    .kpi .l { font-size:12px; opacity:.85; }
    .prompt { background:#102A45; color:#E2C879; padding:12px; border-radius:8px; direction:ltr; text-align:left; font-size:12px; font-family:monospace; }
    .footer { text-align:center; color:#999; font-size:11px; margin-top:32px; border-top:1px solid #eee; padding-top:12px; }
    @media print { body { padding:20px; } h2 { page-break-after:avoid; } }
  </style></head><body>
    <div class="brand"><div class="logo">MNC ARCHITECT AI</div><div class="sub">تقرير معماري — ${project.name}</div></div>
    <div class="meta">العميل: ${project.client} · الموقع: ${project.brief.city} — ${project.brief.district} · ${new Date(report.generatedAt).toLocaleDateString("ar-SA")}</div>

    <h2>1. ملخص المشروع</h2><p>${report.summary}</p>
    <h2>2. الافتراضات</h2>${li(report.assumptions)}
    <h2>3. تحليل الأرض</h2><p>${report.siteAnalysis}</p>
    <h2>4. أفضل فكرة تصميمية</h2><p>${report.bestConcept}</p>
    <h2>5. الخيارات التصميمية</h2>${options}
    <h2>6. جدول المساحات</h2>
    <table><tr><th>البند</th><th>المساحة (م²)</th><th>العدد</th><th>ملاحظات</th></tr>${rows}</table>
    <h2>7. وصف المخطط</h2>
    <ul>
      <li><b>الموقع العام:</b> ${report.planDescription.site}</li>
      <li><b>الدور الأرضي:</b> ${report.planDescription.groundFloor}</li>
      <li><b>الأدوار المتكررة:</b> ${report.planDescription.typicalFloors}</li>
      <li><b>السطح:</b> ${report.planDescription.roof}</li>
      <li><b>المواقف:</b> ${report.planDescription.parking}</li>
    </ul>
    <h2>8. الواجهات والمواد</h2><p>${report.facade}</p>
    <h2>9. التكلفة · 10. الإيراد · 11-13 العائد</h2>
    <div class="kpis">
      <div class="kpi"><div class="v">${sar(report.estimatedCost.total)}</div><div class="l">التكلفة الإجمالية</div></div>
      <div class="kpi"><div class="v">${sar(report.expectedRevenue.total)}</div><div class="l">الإيراد المتوقع</div></div>
      <div class="kpi"><div class="v">${sar(report.netProfit)}</div><div class="l">صافي الربح</div></div>
      <div class="kpi"><div class="v">${report.roi}%</div><div class="l">ROI</div></div>
      <div class="kpi"><div class="v">${report.paybackYears} سنة</div><div class="l">الاسترداد</div></div>
    </div>
    <h2>14. الهندسة القيمية</h2>${li(report.valueEngineering)}
    <h2>15. برومبت الصورة الواقعية</h2><div class="prompt">${report.imagePrompt}</div>
    <h2>16. التوصية النهائية</h2><p>${report.recommendation}</p>
    <div class="footer">© MNC Group — مروان ناظر للاستشارات الهندسية · MNC Architect AI Platform</div>
    <script>window.onload = () => { window.print(); }</script>
  </body></html>`);
  w.document.close();
}

/* ---------------------- JSON ---------------------- */
export async function exportReportJson(project: Project, report: ArchitectReport) {
  const { saveAs } = await import("file-saver");
  const payload = { project: { id: project.id, name: project.name, client: project.client, brief: project.brief }, report };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  saveAs(blob, `${fileBase(project)}.json`);
}

/* ---------------------- Excel (.xlsx) ---------------------- */
export async function exportReportExcel(project: Project, report: ArchitectReport) {
  const XLSX = await import("xlsx");
  const { saveAs } = await import("file-saver");

  const wb = XLSX.utils.book_new();

  const areaWs = XLSX.utils.json_to_sheet(
    report.areaTable.map((r) => ({ "البند": r.label, "المساحة (م²)": r.area, "العدد": r.count ?? "", "ملاحظات": r.notes ?? "" })),
  );
  XLSX.utils.book_append_sheet(wb, areaWs, "المساحات");

  const finWs = XLSX.utils.json_to_sheet([
    { "البند": "سعر المتر (ريال)", "القيمة": report.estimatedCost.perSqm },
    { "البند": "إجمالي المسطحات (م²)", "القيمة": report.estimatedCost.totalBuiltUp },
    { "البند": "التكلفة الإجمالية (ريال)", "القيمة": report.estimatedCost.total },
    { "البند": "الإيراد المتوقع (ريال)", "القيمة": report.expectedRevenue.total },
    { "البند": "صافي الربح (ريال)", "القيمة": report.netProfit },
    { "البند": "ROI (%)", "القيمة": report.roi },
    { "البند": "فترة الاسترداد (سنة)", "القيمة": report.paybackYears },
  ]);
  XLSX.utils.book_append_sheet(wb, finWs, "المؤشرات المالية");

  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  saveAs(new Blob([out], { type: "application/octet-stream" }), `${fileBase(project)}.xlsx`);
}
