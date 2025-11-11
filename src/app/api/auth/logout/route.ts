import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;
  if (sessionId) await auth.invalidateSession(sessionId);

  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", "session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
  return res;
}
