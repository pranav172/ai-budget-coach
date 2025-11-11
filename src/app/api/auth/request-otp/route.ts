import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

function code6() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const code = code6();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.otpCode.create({ data: { email, codeHash, expiresAt } });

  // DEV ONLY: print to server log
  console.log("[DEV OTP]", email, code);

  return NextResponse.json({ ok: true, dev: true });
}
