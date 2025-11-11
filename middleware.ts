import { NextResponse } from "next/server";

export async function middleware(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const hasSession = cookie.includes("session=");
  const url = new URL(req.url);

  const isAuthPage =
    url.pathname.startsWith("/login") || url.pathname.startsWith("/register");

  if (!hasSession && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard", "/upload", "/login", "/register"],
};
