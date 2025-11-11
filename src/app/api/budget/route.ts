import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = monthKey();
  const goal = await prisma.budgetGoal.findUnique({
    where: { userId_month: { userId: user.id, month: key } },
  });

  return NextResponse.json({ month: key, limit: goal?.limit ?? null });
}

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { limit } = await req.json();
  const val = Number(limit);
  if (!val || val < 0) return NextResponse.json({ error: "Invalid limit" }, { status: 400 });

  const key = monthKey();
  const upsert = await prisma.budgetGoal.upsert({
    where: { userId_month: { userId: user.id, month: key } },
    update: { limit: val },
    create: { userId: user.id, month: key, limit: val },
  });

  return NextResponse.json({ month: key, limit: upsert.limit });
}
