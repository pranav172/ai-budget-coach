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
  const [error, setError] = useState<string>("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/ai/analyze", { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        setProvider(j.provider || "gemini");
        setData(j.data || null);
      } else {
        const errorText = await r.text().catch(() => "Failed to load AI insights");
        setError(errorText);
        setData(null);
      }
    } catch (err: any) {
      console.error("AI Panel error:", err);
      setError(err?.message || "Failed to connect to AI service");
      setData(null);
    } finally {
      setLoading(false);
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

      {error ? (
        <div className="text-sm p-3 border border-red-500/30 bg-red-500/5 rounded">
          <p className="font-medium text-red-600 dark:text-red-400">AI temporarily unavailable</p>
          <p className="text-xs opacity-70 mt-1">Your expenses are still being tracked. Try again later.</p>
        </div>
      ) : !data ? (
        <p className="text-sm opacity-70">Loading insights...</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm">{data.month_summary}</p>

          {!!data.top_categories?.length && (
            <div>
              <h4 className="font-medium mb-1">Top categories</h4>
              <ul className="text-sm list-disc pl-5">
                {data.top_categories.map((c, i) => (
                  <li key={i}>{c.category}: ${c.spend?.toFixed?.(0)}</li>
                ))}
              </ul>
            </div>
          )}

          {!!data.anomalies?.length && (
            <div>
              <h4 className="font-medium mb-1">Anomalies</h4>
              <ul className="text-sm list-disc pl-5">
                {data.anomalies.map((a, i) => (
                  <li key={i}>{a.reason} — ${a.amount?.toFixed?.(0)} {a.date ? `(${a.date})` : ""}</li>
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
