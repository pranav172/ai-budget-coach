// src/lib/ai.ts

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Use free OpenRouter models that don't require API keys
const FREE_MODELS = [
  "meta-llama/llama-3.2-3b-instruct:free",
  "google/gemma-2-9b-it:free", 
  "microsoft/phi-3-mini-128k-instruct:free",
];

async function callOpenRouter(prompt: string) {
  for (const model of FREE_MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "HTTP-Referer": SITE_URL,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        }),
      });

      if (res.ok) {
        const j = await res.json();
        const text = j?.choices?.[0]?.message?.content || "";
        if (text) return text;
      }
    } catch (err) {
      console.error(`Model ${model} failed:`, err);
      continue;
    }
  }
  throw new Error("All AI models failed");
}

/**
 * Main AI function - uses free OpenRouter models
 * No API key required!
 */
export async function callAI(prompt: string) {
  return await callOpenRouter(prompt);
}
