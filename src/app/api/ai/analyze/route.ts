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
  try {
    const { user } = await getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await prisma.expense.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 500,
    });

    if (rows.length === 0) {
      return NextResponse.json({
        ok: true,
        provider: "none",
        data: {
          month_summary: "No expenses found. Start by adding some expenses to get AI insights!",
          top_categories: [],
          anomalies: [],
          savings_opportunities: [],
          budget_health: "good" as const,
        }
      });
    }

    const csv = toCSVLike(rows);

    const prompt = `You are an expert financial advisor analyzing someone's expenses. Be thorough and helpful.

USER EXPENSES (CSV format):
\`\`\`
${csv}
\`\`\`

ANALYZE THIS DATA AND PROVIDE:

1. **Month Summary**: Write 2-3 sentences about overall spending patterns, trends, and financial health
2. **Top Categories**: List the 3-5 highest spending categories with amounts
3. **Anomalies**: Identify any unusual or large transactions that stand out
4. **Savings Opportunities**: Provide 3-5 SPECIFIC, ACTIONABLE tips to save money based on their actual spending

BE DETAILED AND SPECIFIC. Use actual numbers from the data. Make it personal and useful.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "month_summary": "detailed 2-3 sentence analysis of spending patterns",
  "top_categories": [
    {"category": "Food", "spend": 450.50},
    {"category": "Transport", "spend": 320.00}
  ],
  "anomalies": [
    {"reason": "Unusually large purchase at X", "amount": 500.00, "date": "2024-12-01"}
  ],
  "savings_opportunities": [
    {
      "title": "Reduce dining out",
      "detail": "You spent $450 on food this month. Cooking at home 2 extra days could save $120/month",
      "impact": "high"
    }
  ],
  "budget_health": "good"|"ok"|"poor"
}`;

    try {
      let text = await callAI(prompt);
      console.log("AI Response (first 200 chars):", text.substring(0, 200));

      // Clean up markdown code blocks if present
      text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

      // Try parsing directly first
      let data: AIAnalysis | null = null;
      try {
        data = JSON.parse(text) as AIAnalysis;
      } catch (parseErr) {
        console.log("Direct parse failed, trying extraction");
        // Try robust extraction
        data = extractJSONObject(text) as AIAnalysis | null;
      }

      if (!data || !data.month_summary) {
        console.error("Invalid data structure:", data);
        throw new Error("Invalid AI response structure");
      }

      return NextResponse.json({
        ok: true,
        provider: process.env.AI_PROVIDER || "gemini",
        data,
      });
    } catch (aiError: any) {
      console.error("AI call error:", aiError);
      
      // Fallback with helpful information
      const fallback: AIAnalysis = {
        month_summary: `AI analysis unavailable: ${aiError.message}. Showing basic expense data.`,
        top_categories: [],
        anomalies: [],
        savings_opportunities: [
          { 
            title: "Review your spending", 
            detail: "Check your top expense categories and look for areas to reduce spending",
            impact: "medium"
          },
        ],
        budget_health: "ok",
      };
      
      return NextResponse.json({
        ok: true,
        provider: process.env.AI_PROVIDER || "gemini",
        data: fallback,
        error: aiError?.message ?? "AI call failed"
      });
    }
  } catch (outerError: any) {
    console.error("Route error:", outerError);
    return NextResponse.json(
      { error: "Internal server error", message: outerError?.message },
      { status: 500 }
    );
  }
}
