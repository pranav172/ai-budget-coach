export type Insight = {
    title: string;
    detail: string;
    impact?: "low" | "medium" | "high";
    action?: string;
  };
  
  export type AIAnalysis = {
    month_summary: string;
    top_categories: Array<{ category: string; spend: number }>;
    anomalies: Array<{ reason: string; amount: number; date?: string }>;
    savings_opportunities: Insight[];
    budget_health: "good" | "ok" | "poor";
  };
  
  export const aiSystemPrompt = `
  You are an AI budget coach.
  Return a SINGLE valid JSON object only. No prose, no code fences.
  JSON schema:
  {
    "month_summary": string,
    "top_categories": [{"category": string, "spend": number}],
    "anomalies": [{"reason": string, "amount": number, "date": string?}],
    "savings_opportunities": [{"title": string, "detail": string, "impact": "low"|"medium"|"high"?, "action": string?}],
    "budget_health": "good"|"ok"|"poor"
  }
  If a field is unknown, return a sensible empty value ([] or "") rather than omitting the key.
  `;
  
  