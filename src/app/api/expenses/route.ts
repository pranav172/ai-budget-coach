import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorizeSmart } from "@/lib/categorize";
import { getSession } from "@/lib/auth";
import { parseExpenseDate } from "@/lib/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ expenses: [] }, { status: 401 });

  const expenses = await prisma.expense.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ expenses });
}

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];

    const created: any[] = [];

    for (const raw of items) {
      // --- normalize fields ---
      const merchant = String(raw.merchant ?? "").trim();
      const amount = Number(raw.amount);
      const dateInput = raw.date;

      if (!merchant || !Number.isFinite(amount) || amount <= 0 || !dateInput) {
        // skip invalid rows
        continue;
      }

      // Handle "YYYY-MM-DD" as UTC midnight to avoid TZ drift; else parse smartly
      let date: Date | null = null;
      if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        date = new Date(dateInput + "T00:00:00.000Z");
      } else {
        date = parseExpenseDate(dateInput);
      }
      if (!date || Number.isNaN(date.getTime())) continue;

      // Category: provided or smart fallback
      let category: string | undefined =
        (raw.category ?? "").toString().trim().toLowerCase() || undefined;
      if (!category) {
        category = await categorizeSmart(merchant);
      }

      const row = await prisma.expense.create({
        data: {
          userId: user.id,
          date,
          amount,
          merchant,
          category,
        },
      });
      created.push(row);
    }

    // nothing valid?
    if (created.length === 0) {
      return NextResponse.json(
        { error: "No valid expense rows to create" },
        { status: 400 }
      );
    }

    // Back-compat: if a single object was sent, return { expense }
    if (!Array.isArray(body)) {
      return NextResponse.json({ ok: true, expense: created[0] });
    }

    // Array payload -> return all
    return NextResponse.json({ ok: true, count: created.length, expenses: created });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
