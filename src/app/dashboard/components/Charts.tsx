"use client";

import { useEffect } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";
import { Pie, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

// Make Chart.js follow Tailwind CSS variables (light/dark)
function useChartTheme() {
  useEffect(() => {
    const rs = getComputedStyle(document.documentElement);
    const fg = rs.getPropertyValue("--foreground")?.trim() || "#e5e7eb";
    const grid = rs.getPropertyValue("--border")?.trim() || "rgba(255,255,255,0.15)";

    ChartJS.defaults.color = fg;
    ChartJS.defaults.borderColor = grid;
    ChartJS.defaults.plugins.legend.labels.color = fg;
  }, []);
}

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom" as const },
    tooltip: { intersect: false, mode: "index" as const },
  },
  scales: {
    x: { grid: { display: true } },
    y: { grid: { display: true, beginAtZero: true } },
  },
};

export default function Charts({ summary }: { summary: any }) {
  useChartTheme();

  // If your category colors were missing, you can inject a palette here:
  const categoryData = {
    ...summary.categoryChart,
    datasets: (summary.categoryChart?.datasets ?? []).map((ds: any) => ({
      ...ds,
      backgroundColor:
        ds.backgroundColor ??
        [
          "oklch(0.646 0.222 41.116)",
          "oklch(0.6 0.118 184.704)",
          "oklch(0.398 0.07 227.392)",
          "oklch(0.828 0.189 84.429)",
          "oklch(0.769 0.188 70.08)",
          "oklch(0.556 0 0)",
        ],
    })),
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="p-4 border rounded h-96 bg-white/60 dark:bg-slate-900/40 backdrop-blur">
        <h2 className="font-semibold mb-2">Category Breakdown</h2>
        <Pie data={categoryData} options={{ ...commonOptions, scales: undefined }} />
      </div>

      <div className="p-4 border rounded h-96 bg-white/60 dark:bg-slate-900/40 backdrop-blur">
        <h2 className="font-semibold mb-2">Monthly Trend</h2>
        <Line data={summary.monthlyChart} options={commonOptions as any} />
      </div>
    </div>
  );
}
