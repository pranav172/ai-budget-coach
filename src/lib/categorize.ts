import { zeroShotCategory } from "./zeroShot";

const RULES: Record<string, string> = {
  swiggy: "food",
  zomato: "food",
  uber: "travel",
  ola: "travel",
  amazon: "shopping",
  flipkart: "shopping",
  electricity: "bills",
  airtel: "bills",
  netflix: "entertainment",
};

export async function categorizeSmart(merchant: string, memo?: string) {
  const text = `${merchant ?? ""} ${memo ?? ""}`.trim();
  // Heuristic quick win
  const key = text.toLowerCase();
  for (const k of Object.keys(RULES)) {
    if (key.includes(k)) return RULES[k];
  }
  // Local zero-shot in browser (non-blocking SSR)
  if (typeof window !== "undefined") {
    return await zeroShotCategory(text);
  }
  return "other";
}
