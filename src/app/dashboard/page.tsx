// src/app/dashboard/page.tsx
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Charts from "./components/Charts";
import Insights from "./components/Insights";
import ExpensesTable from "./components/ExpensesTable";
import BudgetCard from "./components/BudgetCard";
import AdvicePanel from "./components/AdvicePanel";

import { summarize, smartTips, monthContext } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

// helper to compute spend this month
function spentThisMonth(expenses: Array<{ date: Date; amount: number }>) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return expenses.reduce((sum, e) => {
    const d = new Date(e.date);
    return d.getFullYear() === y && d.getMonth() === m ? sum + Number(e.amount || 0) : sum;
  }, 0);
}

export default async function DashboardPage() {
  const { user } = await getSession();
  if (!user) redirect("/login");

  // pull expenses
  const expenses = await prisma.expense.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  // analytics + tips
  const summary = summarize(expenses as any);
  const tips = smartTips(expenses as any);

  // month context & current budget goal (optional usage)
  const { dailyBurn, projectedMonthEnd } = monthContext(expenses as any);
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const goal = await prisma.budgetGoal.findUnique({
    where: { userId_month: { userId: user.id, month: monthKey } },
  });

  const spent = spentThisMonth(expenses);

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <section className="grid md:grid-cols-3 gap-6">
          <div className="rounded border bg-white/60 dark:bg-slate-900/40 backdrop-blur supports-[backdrop-filter]:bg-white/50">
            <BudgetCard spent={spent} />
          </div>

          <div className="p-4 rounded border bg-white/60 dark:bg-slate-900/40 backdrop-blur supports-[backdrop-filter]:bg-white/50">
            <h2 className="font-semibold mb-2">Quick Stats</h2>
            <ul className="text-sm space-y-1">
              <li>Total entries: {expenses.length}</li>
              <li>Categories: {Object.keys(summary.byCategory).length}</li>
              <li>Months tracked: {Object.keys(summary.byMonth).length}</li>
            </ul>
          </div>

          <div className="p-4 rounded border bg-white/60 dark:bg-slate-900/40 backdrop-blur supports-[backdrop-filter]:bg-white/50">
            <h2 className="font-semibold mb-2">Shortcuts</h2>
            <ul className="text-sm space-y-1 list-disc pl-4">
              <li>Upload a CSV from your bank app</li>
              <li>Fix categories from the table below</li>
              <li>Set a monthly goal to track progress</li>
            </ul>
          </div>
        </section>

        {expenses.length ? (
          <>
            <Charts summary={summary} />

            <section className="p-4 rounded border bg-white/60 dark:bg-slate-900/40 backdrop-blur supports-[backdrop-filter]:bg-white/50">
              <h2 className="font-semibold mb-2">AI Coaching</h2>
              {/* Uses /api/ai/analyze internally; no props needed */}
              <AdvicePanel />
            </section>

            <section className="p-4 rounded border bg-white/60 dark:bg-slate-900/40 backdrop-blur supports-[backdrop-filter]:bg-white/50">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Transactions</h2>
                <div className="flex gap-2">
                  <Link href="/api/export/csv">
                    <Button variant="outline" size="sm">Export CSV</Button>
                  </Link>
                  <Link href="/api/export/pdf">
                    <Button variant="outline" size="sm">Export PDF</Button>
                  </Link>
                </div>
              </div>
              <ExpensesTable initial={expenses as any} />
            </section>
          </>
        ) : (
          <p className="opacity-70">
            No expenses yet. Upload a CSV or add one manually.
          </p>
        )}
      </main>
    </>
  );
}
