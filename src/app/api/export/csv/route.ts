import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.expense.findMany({ where: { userId: user.id }, orderBy: { date: "desc" } });
  const header = "date,amount,merchant,category\n";
  const body = rows.map(r =>
    `${new Date(r.date).toISOString().slice(0,10)},${r.amount},"${r.merchant.replace(/"/g,'""')}",${r.category ?? ""}`
  ).join("\n");
  const csv = header + body + "\n";
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="expenses.csv"`
    }
  });
}
