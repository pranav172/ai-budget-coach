import { Expense } from "@/types/expense";

// palette for charts
const PALETTE = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4",
  "#a855f7", "#84cc16", "#f97316", "#e11d48", "#14b8a6"
];

function ymKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function summarize(expenses: Expense[]) {
  const byCategory: Record<string, number> = {};
  const byMonth: Record<string, number> = {};

  for (const e of expenses) {
    const amt = Number(e.amount) || 0;
    const cat = (e.category ?? "other").toLowerCase();
    const d = new Date(e.date);
    if (Number.isNaN(d.getTime())) continue;

    byCategory[cat] = (byCategory[cat] ?? 0) + amt;
    const key = ymKey(d);
    byMonth[key] = (byMonth[key] ?? 0) + amt;
  }

  const catLabels = Object.keys(byCategory);
  const catData = catLabels.map((k) => byCategory[k]);
  const categoryChart = {
    labels: catLabels,
    datasets: [{
      label: "Spend by category",
      data: catData,
      backgroundColor: catLabels.map((_, i) => PALETTE[i % PALETTE.length]),
      borderWidth: 1
    }]
  };

  const months = Object.keys(byMonth).sort();
  const monthlyChart = {
    labels: months,
    datasets: [{
      label: "Monthly spend",
      data: months.map((m) => byMonth[m]),
      fill: true,
      tension: 0.3
    }]
  };

  return { categoryChart, monthlyChart, byCategory, byMonth };
}

export function monthContext(expenses: Expense[]) {
  // current month stats
  const now = new Date();
  const monthKey = ymKey(now);
  const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysInMonth = mEnd.getDate();
  const dayOfMonth = now.getDate();

  let spentThisMonth = 0;
  for (const e of expenses) {
    const d = new Date(e.date);
    if (ymKey(d) === monthKey) spentThisMonth += Number(e.amount) || 0;
  }
  const dailyBurn = spentThisMonth / Math.max(1, dayOfMonth);
  const projectedMonthEnd = Math.round(dailyBurn * daysInMonth);

  return { monthKey, spentThisMonth, dailyBurn, projectedMonthEnd, dayOfMonth, daysInMonth };
}

export function smartTips(expenses: Expense[], budgetLimit?: number | null) {
  const { byCategory } = summarize(expenses);
  const { spentThisMonth, projectedMonthEnd, daysInMonth, dayOfMonth } = monthContext(expenses);
  const total = Object.values(byCategory).reduce((a, b) => a + b, 0) || 1;

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const tips: string[] = [];

  if (sorted[0]) {
    const [top, amt] = sorted[0];
    const pct = Math.round((amt / total) * 100);
    tips.push(`Top category is **${top}** (${pct}%). Try a cap for the next 7 days.`);
  }
  if (sorted[1]) {
    const [second, amt] = sorted[1];
    const pct = Math.round((amt / total) * 100);
    tips.push(`Second is **${second}** (${pct}%). Cutting ~10% here saves instantly.`);
  }

  tips.push(`Daily burn is **₹${Math.round(spentThisMonth / Math.max(1, dayOfMonth))}**. Projected month-end: **₹${projectedMonthEnd}**.`);

  if (budgetLimit && budgetLimit > 0) {
    const pct = Math.round((spentThisMonth / budgetLimit) * 100);
    const pace = Math.round((projectedMonthEnd / budgetLimit) * 100);
    tips.push(`Budget: **₹${budgetLimit}**. Used **${pct}%** with ${daysInMonth - dayOfMonth} days left. Projected usage: **${pace}%**.`);
    if (pace > 110) tips.push(`⚠️ You are on track to exceed budget. Set a daily cap of ₹${Math.round((budgetLimit - spentThisMonth) / Math.max(1, daysInMonth - dayOfMonth))}.`);
  }

  return tips;
}
