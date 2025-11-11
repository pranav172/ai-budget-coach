import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseExpenseDate } from "@/lib/dates";

// Next.js 16: params is a Promise — await it
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json();
  const data: any = {};
  if (body.merchant !== undefined) data.merchant = String(body.merchant);
  if (body.category !== undefined) data.category = body.category ? String(body.category) : null;
  if (body.amount !== undefined) data.amount = Number(body.amount);
  if (body.date !== undefined) {
    const d = parseExpenseDate(body.date);
    if (!d) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    data.date = d;
  }

  // (optional) verify ownership first
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.expense.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true, expense: updated });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // (optional) verify ownership
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
