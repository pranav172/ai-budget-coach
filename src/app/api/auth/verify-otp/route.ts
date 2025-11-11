import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, code } = await req.json();
  if (!email || !code) return NextResponse.json({ error: "Email & code required" }, { status: 400 });

  const latest = await prisma.otpCode.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" }
  });
  if (!latest) return NextResponse.json({ error: "No OTP found" }, { status: 400 });
  if (latest.expiresAt < new Date()) return NextResponse.json({ error: "OTP expired" }, { status: 400 });

  const ok = await bcrypt.compare(code, latest.codeHash);
  if (!ok) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  // find or create user
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email, password: await bcrypt.hash("otp@local", 10) } });
  }

  const session = await auth.createSession(user.id, {});
  const cookie = auth.createSessionCookie(session.id);

  const res = NextResponse.json({ ok: true });
  res.headers.set(
    "Set-Cookie",
    `${cookie.name}=${cookie.value}; ${Object.entries(cookie.attributes).map(([k,v]) => (v===true?k:`${k}=${v}`)).join("; ")}`
  );
  return res;
}
