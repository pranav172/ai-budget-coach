// src/lib/ai.ts
const PROVIDER = process.env.AI_PROVIDER?.toLowerCase() || "openrouter";

// Prefer setting this in .env for correct referer on prod
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";

/**
 * Try several free-friendly OpenRouter models in order.
 * If one 404s or errors, we fall back to the next.
 */
const OPENROUTER_MODELS = [
  // Auto router (lets OpenRouter pick a working model)
  "openrouter/auto",
  // Popular free(-ish) fallbacks; OpenRouter may rotate availability
  "meta-llama/llama-3.1-8b-instruct:free",
  "qwen/qwen2.5-7b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
];

async function callOpenRouter(prompt: string) {
  let lastErr = "";
  for (const model of OPENROUTER_MODELS) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY || ""}`,
        "Content-Type": "application/json",
        // These two headers help with routing and some model providers
        "HTTP-Referer": SITE_URL,
        "X-Title": "AI Budget Coach",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        // ⬇️ ask for strict JSON
        response_format: { type: "json_object" }
      }),
    });

    if (res.ok) {
      const j = await res.json().catch(() => ({}));
      const text = j?.choices?.[0]?.message?.content ?? "";
      if (text) return text;
      lastErr = `Empty response from ${model}`;
      continue;
    }

    // Read body once for debugging
    const body = await res.text().catch(() => "");
    lastErr = `${res.status} ${res.statusText} on ${model}${body ? ` — ${body}` : ""}`;

    // 404 is common for missing/unavailable model. Try next.
    if (res.status === 404) continue;

    // For other status codes, try the next model as well.
    // (Rate limits, etc.)
  }
  throw new Error(`OpenRouter failed: ${lastErr || "No models succeeded"}`);
}

async function callGroq(prompt: string) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY || ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq ${res.status} ${res.statusText}${body ? ` — ${body}` : ""}`);
  }
  const j = await res.json();
  return j?.choices?.[0]?.message?.content ?? "";
}

export async function callAI(prompt: string) {
  if (PROVIDER === "groq") return callGroq(prompt);
  return callOpenRouter(prompt);
}
