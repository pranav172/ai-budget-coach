"use client";
import { useState } from "react";

export default function LoginOTP() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email"|"code">("email");
  const [msg, setMsg] = useState("");

  async function requestCode() {
    setMsg("Sending code…");
    const r = await fetch("/api/auth/request-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    setMsg(r.ok ? "Code sent (check server console in dev)" : "Failed");
    if (r.ok) setStep("code");
  }
  async function verify() {
    setMsg("Verifying…");
    const r = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) });
    if (r.ok) { window.location.href = "/dashboard"; } else { const j = await r.json().catch(()=>({})); setMsg(j?.error ?? "Failed"); }
  }

  return (
    <main className="max-w-sm mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-bold">Login with OTP</h1>
      {step === "email" ? (
        <>
          <input className="border p-2 w-full rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <button className="bg-black text-white px-4 py-2 rounded w-full" onClick={requestCode}>Send Code</button>
        </>
      ) : (
        <>
          <input className="border p-2 w-full rounded" placeholder="6-digit code" value={code} onChange={e=>setCode(e.target.value)} />
          <button className="bg-black text-white px-4 py-2 rounded w-full" onClick={verify}>Verify</button>
        </>
      )}
      {msg && <p className="text-sm">{msg}</p>}
    </main>
  );
}
