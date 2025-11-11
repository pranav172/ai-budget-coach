"use client";
import Papa from "papaparse";
import Navbar from "@/components/Navbar";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = { date: string; amount: string; merchant: string; category?: string };

export default function UploadPage() {
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({ date: "", amount: "", merchant: "", category: "" });
  const router = useRouter();

  async function handleFile(file: File) {
    setStatus("Parsing CSV…");
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (r) => {
        try {
          const cleaned = r.data
            .filter((x) => x.date && x.amount && x.merchant)
            .map((x) => ({
              date: x.date,
              amount: parseFloat(x.amount),
              merchant: x.merchant,
              category: x.category || undefined
            }));

          if (!cleaned.length) {
            setStatus("No valid rows found.");
            return;
          }

          setStatus("Uploading to server…");
          const res = await fetch("/api/expenses/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cleaned)
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || "Upload failed");

          setStatus(`Imported ${data.count} rows ✅ Redirecting…`);
          setTimeout(() => router.push("/dashboard"), 600);
        } catch (err: any) {
          setStatus(`Error: ${err.message}`);
        }
      },
      error: (err) => setStatus(`Parse error: ${err.message}`)
    });
  }

  async function submitQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Saving entry…");
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (res.ok) {
      setStatus("Added ✅ Redirecting…");
      setForm({ date: "", amount: "", merchant: "", category: "" });
      setTimeout(() => router.push("/dashboard"), 400);
    } else {
      setStatus(`Error: ${data.error}`);
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <section>
          <h1 className="text-2xl font-bold mb-2">Upload CSV</h1>
          <p className="opacity-80 text-sm mb-2">
            Expected columns: <code>date, amount, merchant[, category]</code>
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          />
        </section>

        <section className="p-4 border rounded space-y-3">
          <h2 className="text-lg font-semibold">Quick Add Expense</h2>
          <form onSubmit={submitQuickAdd} className="grid grid-cols-2 gap-3">
            <input className="border p-2 rounded" type="date"
              value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} required />
            <input className="border p-2 rounded" type="number" step="0.01" placeholder="Amount"
              value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} required />
            <input className="border p-2 rounded col-span-2" type="text" placeholder="Merchant"
              value={form.merchant} onChange={(e) => setForm(f => ({ ...f, merchant: e.target.value }))} required />
            <input className="border p-2 rounded col-span-2" type="text" placeholder="Category (optional)"
              value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} />
            <button className="bg-black text-white rounded px-4 py-2 col-span-2">Add</button>
          </form>
        </section>

        {status && <p className="text-sm">{status}</p>}
      </main>
    </>
  );
}
