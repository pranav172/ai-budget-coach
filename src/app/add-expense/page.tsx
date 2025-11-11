"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const CATEGORIES = ["food", "travel", "shopping", "bills", "entertainment", "other"] as const;

export default function AddExpensePage() {
  const router = useRouter();
  const [date, setDate] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [merchant, setMerchant] = useState<string>("");
  const [category, setCategory] = useState<string>("other");
  const [pending, setPending] = useState(false);

  async function submit() {
    const amt = Number(amount);
    if (!date || !merchant.trim() || !Number.isFinite(amt) || amt <= 0) {
      toast.error("Please enter a valid date, merchant and amount");
      return;
    }
    setPending(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date, // yyyy-mm-dd from <input type="date">
        amount: amt,
        merchant: merchant.trim(),
        category: category || undefined,
      }),
    });
    setPending(false);

    if (res.ok) {
      toast.success("Expense added");
      router.push("/dashboard");
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      toast.error(j?.error ?? "Failed to add expense");
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Add Expense</h1>

        <div className="grid grid-cols-1 gap-4">
          <label className="space-y-1">
            <span className="text-sm">Date</span>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <label className="space-y-1">
            <span className="text-sm">Amount (₹)</span>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>

          <label className="space-y-1">
            <span className="text-sm">Merchant</span>
            <Input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="e.g., Swiggy, Uber" />
          </label>

          <label className="space-y-1">
            <span className="text-sm">Category</span>
            <Select value={category} onValueChange={(v) => setCategory(v)}>
              <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>

        <div className="flex gap-2">
          <Button onClick={submit} disabled={pending}>
            {pending ? "Saving…" : "Save Expense"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Cancel
          </Button>
        </div>
      </main>
    </>
  );
}
