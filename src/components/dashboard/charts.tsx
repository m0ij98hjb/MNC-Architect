"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const GOLD = "#C9A24B";
const GOLD_SOFT = "rgba(201,162,75,.35)";
const GRID = "rgba(148,163,184,.12)";

export function MonthlyBar({ labels, data }: { labels: string[]; data: number[] }) {
  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            label: "مشاريع",
            data,
            backgroundColor: GOLD_SOFT,
            borderColor: GOLD,
            borderWidth: 1.5,
            borderRadius: 6,
            maxBarThickness: 34,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#94a3b8", font: { size: 11 } } },
          y: { grid: { color: GRID }, ticks: { color: "#94a3b8", font: { size: 11 } }, beginAtZero: true },
        },
      }}
    />
  );
}

export function TypesDoughnut({ labels, data }: { labels: string[]; data: number[] }) {
  const palette = ["#C9A24B", "#E2C879", "#163554", "#9C7A30", "#5B7B9A", "#B8985A"];
  return (
    <Doughnut
      data={{
        labels,
        datasets: [{ data, backgroundColor: palette, borderColor: "transparent", borderWidth: 0, hoverOffset: 6 }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: { position: "bottom", labels: { color: "#94a3b8", font: { size: 11 }, boxWidth: 10, padding: 12 } },
        },
      }}
    />
  );
}
