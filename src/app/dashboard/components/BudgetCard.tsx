"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { BudgetAlertToast } from "@/components/BudgetAlertToast";

export default function BudgetCard({ spent }: { spent: number }) {
  const [limit, setLimit] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [hasShownAlert, setHasShownAlert] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/budget", { cache: "no-store" });
      const j = await r.json();
      setLimit(j.limit ?? null);
    })();
  }, []);

  const pct = limit ? Math.min(100, Math.round((spent / limit) * 100)) : 0;

  // Show alert when hitting thresholds
  useEffect(() => {
    if (!limit) return;

    const threshold = pct >= 100 ? "100" : pct >= 90 ? "90" : pct >= 75 ? "75" : pct >= 50 ? "50" : null;
    
    if (threshold && !hasShownAlert[threshold]) {
      setShowAlert(true);
      setHasShownAlert(prev => ({ ...prev, [threshold]: true }));
    }
  }, [pct, limit, hasShownAlert]);

  async function save() {
    setSaving(true);
    const r = await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit }),
    });
    setSaving(false);
    if (!r.ok) alert("Failed to save budget");
  }

  // Dynamic color based on budget usage
  const getStatusColor = () => {
    if (pct >= 100) return "text-red-600 dark:text-red-400";
    if (pct >= 90) return "text-red-500 dark:text-red-400";
    if (pct >= 75) return "text-yellow-600 dark:text-yellow-400";
    if (pct >= 50) return "text-blue-600 dark:text-blue-400";
    return "text-green-600 dark:text-green-400";
  };

  const shouldPulse = pct >= 90;

  return (
    <>
      <div className={`p-4 border rounded space-y-3 transition-all duration-300 ${
        shouldPulse ? "animate-pulse shadow-lg border-red-500/50" : ""
      }`}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Monthly Budget</h2>
          {limit !== null && (
            <span className="text-sm opacity-70">
              $<AnimatedNumber value={limit} decimals={2} />
            </span>
          )}
        </div>

        <Progress value={pct} className="h-3" />
        <div className="text-sm flex justify-between">
          <span className={getStatusColor()}>
            Spent: $<AnimatedNumber value={spent} decimals={2} />
          </span>
          <span className={`font-semibold ${getStatusColor()}`}>
            {limit !== null ? `${pct}%` : "No budget set"}
          </span>
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Set monthly limit ($)"
            value={limit ?? ""}
            onChange={(e) => setLimit(e.target.value ? Number(e.target.value) : null)}
          />
          <Button onClick={save} disabled={saving || limit === null}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {showAlert && limit && (
        <BudgetAlertToast
          spent={spent}
          limit={limit}
          onClose={() => setShowAlert(false)}
        />
      )}
    </>
  );
}
