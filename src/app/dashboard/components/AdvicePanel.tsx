"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type AIData = {
  month_summary: string;
  top_categories: { category: string; spend: number }[];
  anomalies: { reason: string; amount: number; date?: string }[];
  savings_opportunities: { title: string; detail: string; impact?: string; action?: string }[];
  budget_health: "good" | "ok" | "poor";
};

export default function AdvicePanel() {
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<string>("");
  const [data, setData] = useState<AIData | null>(null);

  async function run() {
    setLoading(true);
    const r = await fetch("/api/ai/analyze", { cache: "no-store" });
    setLoading(false);
    if (r.ok) {
      const j = await r.json();
      setProvider(j.provider);
      setData(j.data);
    } else {
      setData(null);
    }
  }

  useEffect(() => { run(); }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">AI Insights</h3>
        <div className="flex items-center gap-2">
          {provider ? <Badge>AI: {provider}</Badge> : null}
          <Button variant="outline" onClick={run} disabled={loading}>
            {loading ? "Thinking…" : "Regenerate"}
          </Button>
        </div>
      </div>

      {!data ? (
        <p className="text-sm opacity-70">No insights yet.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm">{data.month_summary}</p>

          {!!data.top_categories?.length && (
            <div>
              <h4 className="font-medium mb-1">Top categories</h4>
              <ul className="text-sm list-disc pl-5">
                {data.top_categories.map((c, i) => (
                  <li key={i}>{c.category}: ₹{c.spend?.toFixed?.(0)}</li>
                ))}
              </ul>
            </div>
          )}

          {!!data.anomalies?.length && (
            <div>
              <h4 className="font-medium mb-1">Anomalies</h4>
              <ul className="text-sm list-disc pl-5">
                {data.anomalies.map((a, i) => (
                  <li key={i}>{a.reason} — ₹{a.amount?.toFixed?.(0)} {a.date ? `(${a.date})` : ""}</li>
                ))}
              </ul>
            </div>
          )}

          {!!data.savings_opportunities?.length && (
            <div>
              <h4 className="font-medium mb-1">Savings opportunities</h4>
              <ul className="text-sm list-disc pl-5">
                {data.savings_opportunities.map((s, i) => (
                  <li key={i}><span className="font-medium">{s.title}:</span> {s.detail} {s.action ? `→ ${s.action}` : ""}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
