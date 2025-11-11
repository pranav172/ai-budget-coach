import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email & password required" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed } });

    const session = await auth.createSession(user.id, {});
    const cookie = auth.createSessionCookie(session.id);

    const res = NextResponse.json({ ok: true });
    res.headers.set(
      "Set-Cookie",
      `${cookie.name}=${cookie.value}; ${Object.entries(cookie.attributes)
        .map(([k, v]) => (v === true ? k : `${k}=${v}`))
        .join("; ")}`
    );
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
