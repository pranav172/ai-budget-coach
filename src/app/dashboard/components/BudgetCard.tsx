"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function BudgetCard({ spent }: { spent: number }) {
  const [limit, setLimit] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/budget", { cache: "no-store" });
      const j = await r.json();
      setLimit(j.limit ?? null);
    })();
  }, []);

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

  const pct = limit ? Math.min(100, Math.round((spent / limit) * 100)) : 0;

  return (
    <div className="p-4 border rounded space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Monthly Budget</h2>
        {limit !== null && <span className="text-sm opacity-70">₹{limit}</span>}
      </div>

      <Progress value={pct} />
      <div className="text-sm flex justify-between">
        <span>Spent: ₹{Math.round(spent)}</span>
        <span>{limit !== null ? `${pct}%` : "No budget set"}</span>
      </div>

      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="Set monthly limit (₹)"
          value={limit ?? ""}
          onChange={(e) => setLimit(e.target.value ? Number(e.target.value) : null)}
        />
        <Button onClick={save} disabled={saving || limit === null}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
