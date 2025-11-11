import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { aiSystemPrompt, type AIAnalysis } from "@/lib/ai-types";
import { callAI } from "@/lib/ai";
import { extractJSONObject } from "@/lib/json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toCSVLike(rows: Array<{ date: Date; amount: number; merchant: string; category: string | null }>) {
  const header = "date,amount,merchant,category";
  const lines = rows.slice(0, 500).map((r) =>
    `${new Date(r.date).toISOString().slice(0, 10)},${Number(r.amount).toFixed(2)},"${r.merchant.replaceAll('"', '""')}",${r.category ?? ""}`
  );
  return [header, ...lines].join("\n");
}

export async function GET() {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.expense.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 500,
  });

  const csv = toCSVLike(rows);

  const prompt = `
${aiSystemPrompt}

User expenses (CSV):
\`\`\`
${csv}
\`\`\`

Return ONLY a valid JSON object with keys:
- month_summary (string)
- top_categories (array of {category, spend})
- anomalies (array of {reason, amount, date?})
- savings_opportunities (array of {title, detail, impact?, action?})
- budget_health ("good" | "ok" | "poor")
`;

  try {
    let text = await callAI(prompt);

    // 1) Try robust extraction/repair
    let data = extractJSONObject(text) as AIAnalysis | null;

    // 2) If provider already sent clean JSON (due to response_format), parse directly
    if (!data) {
      try {
        data = JSON.parse(text) as AIAnalysis;
      } catch {
        // ignore; we'll fallback below
      }
    }

    if (!data) {
      // Fallback so UI still shows something useful
      const fallback: AIAnalysis = {
        month_summary: "Could not parse AI response. Showing heuristic insights.",
        top_categories: [],
        anomalies: [],
        savings_opportunities: [
          { title: "Fallback tip", detail: "Review top 3 categories and cut 10% this month", impact: "medium" },
        ],
        budget_health: "ok",
      };
      return NextResponse.json({
        ok: true,
        provider: process.env.AI_PROVIDER || "openrouter",
        data: fallback,
      });
    }

    return NextResponse.json({
      ok: true,
      provider: process.env.AI_PROVIDER || "openrouter",
      data,
    });
  } catch (e: any) {
    // Hard failure (network, rate limit, etc.)
    const fallback: AIAnalysis = {
      month_summary: "AI provider error. Showing heuristic insights.",
      top_categories: [],
      anomalies: [],
      savings_opportunities: [
        { title: "Fallback tip", detail: "Review top 3 categories and cut 10% this month", impact: "medium" },
      ],
      budget_health: "ok",
    };
    return NextResponse.json(
      { ok: true, provider: process.env.AI_PROVIDER || "openrouter", data: fallback, error: e?.message ?? "AI call failed" },
      { status: 200 }
    );
  }
}
