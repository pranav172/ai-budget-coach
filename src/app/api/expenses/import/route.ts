import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorizeSmart } from "@/lib/categorize";
import { getSession } from "@/lib/auth";
import { parseExpenseDate } from "@/lib/dates";

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!Array.isArray(body)) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const rows = body
      .map((r) => ({
        date: parseExpenseDate(r?.date),
        amount: Number(r?.amount),
        merchant: String(r?.merchant ?? ""),
        category: r?.category || categorizeSmart(String(r?.merchant ?? "")),
      }))
      .filter((r) => r.date && r.amount && r.merchant) as Array<{
        date: Date; amount: number; merchant: string; category?: string;
      }>;

    if (!rows.length) return NextResponse.json({ error: "No valid rows" }, { status: 400 });

    await prisma.$transaction(
      rows.map((e) =>
        prisma.expense.create({ data: { ...e, userId: user.id } })
      )
    );

    return NextResponse.json({ ok: true, count: rows.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
