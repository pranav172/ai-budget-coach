// Best-effort: grab first {...} block and parse; do a few safe repairs.
export function extractJSONObject(text: string): any | null {
    if (!text) return null;
  
    // Fast path: if it already looks like JSON (and sometimes wrapped in ```json fences)
    const t = text.trim().replace(/^```json/i, "```").replace(/```$/i, "").trim();
    try {
      return JSON.parse(t);
    } catch {
      // continue to search/repair
    }
  
    // Find first balanced { ... }
    const s = t;
    let start = s.indexOf("{");
    while (start !== -1) {
      let depth = 0;
      for (let i = start; i < s.length; i++) {
        const ch = s[i];
        if (ch === "{") depth++;
        else if (ch === "}") {
          depth--;
          if (depth === 0) {
            const cand = s.slice(start, i + 1);
            // small repairs: remove trailing commas, convert single quotes, quote keys
            const repaired = cand
              .replace(/,\s*}/g, "}") // trailing commas in objects
              .replace(/,\s*]/g, "]") // trailing commas in arrays
              .replace(/(['"])?([a-zA-Z0-9_]+)\1\s*:/g, '"$2":') // unquoted keys -> quoted
              .replace(/'/g, '"'); // single to double quotes
            try {
              return JSON.parse(repaired);
            } catch {
              // keep scanning
            }
          }
        }
      }
      start = s.indexOf("{", start + 1);
    }
    return null;
  }
  