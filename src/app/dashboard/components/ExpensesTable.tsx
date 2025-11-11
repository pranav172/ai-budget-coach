"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatISODate } from "@/lib/dates";

type Expense = {
  id: string;
  date: string; // ISO string
  amount: number;
  merchant: string;
  category?: string | null;
};

const CATEGORIES = ["food", "travel", "shopping", "bills", "entertainment", "other"] as const;

export default function ExpensesTable({ initial }: { initial: Expense[] }) {
  const [rows, setRows] = useState<Expense[]>(initial ?? []);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Expense | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  // fetch fresh rows on mount (so client matches server-render)
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/expenses", { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        setRows(j.expenses ?? []);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) =>
      r.merchant.toLowerCase().includes(t) ||
      (r.category ?? "other").toLowerCase().includes(t)
    );
  }, [rows, q]);

  async function del(id: string) {
    if (!confirm("Delete this expense?")) return;
    const prev = rows;
    setRows((s) => s.filter((r) => r.id !== id));
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      router.refresh();
    } else {
      setRows(prev); // rollback
      const j = await res.json().catch(() => ({}));
      toast.error(j?.error ?? "Delete failed");
    }
  }

  async function saveEdit() {
    if (!edit) return;

    // normalize payload (client safety)
    const payload = {
      ...edit,
      amount: Number(edit.amount),
      // date input is YYYY-MM-DD; send full ISO so server parses consistently
      date: /^\d{4}-\d{2}-\d{2}$/.test(edit.date)
        ? new Date(edit.date + "T00:00:00.000Z").toISOString()
        : new Date(edit.date).toISOString(),
      category: (edit.category ?? "other").toLowerCase(),
      merchant: String(edit.merchant || "").trim(),
    };

    if (!payload.merchant || !Number.isFinite(payload.amount)) {
      toast.error("Please enter a valid merchant and amount");
      return;
    }

    setPending(true);
    const res = await fetch(`/api/expenses/${edit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setPending(false);

    if (res.ok) {
      const { expense } = await res.json();
      setRows((s) => s.map((r) => (r.id === edit.id ? expense : r)));
      setEdit(null);
      toast.success("Saved");
      router.refresh(); // refresh charts & summaries
    } else {
      const j = await res.json().catch(() => ({}));
      toast.error(j?.error ?? "Save failed");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Search merchant/category..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="rounded border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  {/* SSR/CSR-stable */}
                  <span suppressHydrationWarning>{formatISODate(r.date)}</span>
                </TableCell>
                <TableCell>{r.merchant}</TableCell>
                <TableCell className="capitalize">{r.category ?? "other"}</TableCell>
                <TableCell className="text-right">₹{Number(r.amount).toFixed(2)}</TableCell>
                <TableCell className="space-x-2 text-right">
                  {/* EDIT */}
                  <Dialog open={!!edit && edit.id === r.id} onOpenChange={(o) => !o && setEdit(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setEdit(r)}>
                        Edit
                      </Button>
                    </DialogTrigger>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Expense</DialogTitle>
                      </DialogHeader>

                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="date"
                          value={formatISODate(edit?.date ?? r.date)}
                          onChange={(e) =>
                            setEdit((x) => (x ? ({ ...x, date: e.target.value }) as any : x))
                          }
                        />
                        <Input
                          type="number"
                          step="0.01"
                          value={edit?.amount ?? r.amount}
                          onChange={(e) =>
                            setEdit((x) => (x ? { ...x, amount: Number(e.target.value) } : x))
                          }
                        />
                        <Input
                          className="col-span-2"
                          value={edit?.merchant ?? r.merchant}
                          onChange={(e) =>
                            setEdit((x) => (x ? { ...x, merchant: e.target.value } : x))
                          }
                        />
                        <Select
                          value={(edit?.category ?? r.category ?? "other") || "other"}
                          onValueChange={(v) => setEdit((x) => (x ? { ...x, category: v } : x))}
                        >
                          <SelectTrigger className="col-span-2">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <DialogFooter>
                        <Button variant="ghost" onClick={() => setEdit(null)}>
                          Cancel
                        </Button>
                        <Button onClick={saveEdit} disabled={pending}>
                          {pending ? "Saving…" : "Save"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* DELETE */}
                  <Button variant="destructive" size="sm" onClick={() => del(r.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {!filtered.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 opacity-70">
                  No expenses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
