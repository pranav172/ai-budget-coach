"use client";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [status, setStatus] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setStatus("Signing in...");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setStatus(res.ok ? "Logged in ✅" : `Error: ${data.error}`);
    if (res.ok) window.location.href = "/dashboard";
  }

  return (
    <main className="max-w-sm mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-bold">Login</h1>
      <form onSubmit={onSubmit} className="space-y-2">
        <input name="email" type="email" placeholder="Email" className="border p-2 w-full rounded" required />
        <input name="password" type="password" placeholder="Password" className="border p-2 w-full rounded" required />
        <button className="bg-black text-white px-4 py-2 rounded w-full">Login</button>
      </form>
      <p className="text-sm">
        New here? <Link href="/register" className="underline">Create account</Link>
      </p>
      {status && <p className="text-sm">{status}</p>}
    </main>
  );
}
