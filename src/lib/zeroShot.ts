// zeroShot.ts — local zero-shot category inference (browser)
export type Category = "food" | "travel" | "shopping" | "bills" | "entertainment" | "other";

const LABELS: Category[] = ["food","travel","shopping","bills","entertainment","other"];

let classifier: any | null = null;

export async function loadZeroShot() {
  if (typeof window === "undefined") return null; // SSR guard
  if (classifier) return classifier;
  const { pipeline } = await import("@xenova/transformers");
  // tiny NLI model for classification (fastest practical)
  classifier = await pipeline("zero-shot-classification", "Xenova/nli-deberta-v3-xsmall");
  return classifier;
}

export async function zeroShotCategory(text: string): Promise<Category> {
  try {
    const clf = await loadZeroShot();
    if (!clf) return "other";
    const out = await clf(text, LABELS, { multi_label: false });
    // out.labels sorted by score desc
    const label = (out?.labels?.[0] ?? "other") as Category;
    return LABELS.includes(label) ? label : "other";
  } catch {
    return "other";
  }
}
