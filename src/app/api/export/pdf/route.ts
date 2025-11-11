// src/app/api/export/pdf/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
// ⬇️ use the standalone build
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { Readable } from "stream";

export const runtime = "nodejs";        // ensure Node runtime
export const dynamic = "force-dynamic"; // avoid caching

export async function GET() {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.expense.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  const stream = new Readable({ read() {} });
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  doc.on("data", (chunk: Buffer) => stream.push(chunk));
  doc.on("end", () => stream.push(null));

  // Write contents
  doc.fontSize(18).text("AI Budget Coach — Report", { align: "left" });
  doc.moveDown().fontSize(12);

  rows.slice(0, 200).forEach((r) => {
    const date = new Date(r.date).toISOString().slice(0, 10);
    doc.text(`${date}  ₹${Number(r.amount).toFixed(2)}  ${r.merchant}  ${r.category ?? ""}`);
  });

  doc.end();

  return new NextResponse(stream as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="report.pdf"`,
    },
  });
}
