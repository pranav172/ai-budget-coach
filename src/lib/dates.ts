// src/lib/dates.ts

// Build a UTC midnight date (prevents off-by-one in different timezones)
function makeUTCDate(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Parse common date inputs:
 * - ISO strings: 2025-03-21, 2025-03-21T12:30:00Z, etc.
 * - DMY: 21/03/2025 or 21-03-2025
 * - MDY: 03/21/2025 or 03-21-2025
 *
 * Heuristic:
 * - If a > 12 → treat as DMY (dd/mm/yyyy)
 * - If b > 12 → treat as MDY (mm/dd/yyyy)
 * - If both ≤ 12 → default to DMY (India-friendly)
 */
export function parseExpenseDate(input: unknown): Date | null {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  // ISO first (lets Date parse the timezone if present)
  const iso = new Date(raw);
  if (!Number.isNaN(iso.getTime())) return iso;

  // Generic split for dd/mm/yyyy or mm/dd/yyyy
  const m = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2}|\d{4})$/);
  if (!m) return null;

  let a = Number(m[1]);
  let b = Number(m[2]);
  let y = Number(m[3]);
  if (y < 100) y += 2000; // handle 2-digit years safely

  // Invalid day/month bounds quick check
  if (a < 1 || a > 31 || b < 1 || b > 31) return null;

  // Decide DMY vs MDY
  let dd: number, mm: number;
  if (a > 12 && b <= 12) {
    // 21/03/2025 → DMY
    dd = a; mm = b;
  } else if (b > 12 && a <= 12) {
    // 03/21/2025 → MDY
    mm = a; dd = b;
  } else {
    // ambiguous (both ≤ 12). Default to DMY for India
    dd = a; mm = b;
  }

  const d = makeUTCDate(y, mm, dd);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/** Stable, SSR/CSR-safe display (YYYY-MM-DD in UTC) */
export function formatISODate(value: string | Date): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}
