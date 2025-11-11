"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-30 w-full border-b bg-white/60 dark:bg-slate-900/40 backdrop-blur supports-[backdrop-filter]:bg-white/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 p-3">
        <Link href="/dashboard" className="font-semibold">
          AI Budget Coach
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/upload">
            <Button variant="outline">Upload</Button>
          </Link>
          <Link href="/add-expense">
            <Button variant="outline">Add Expense</Button>
          </Link>
          <Link href="/api/export/csv">
            <Button variant="outline" size="sm">CSV</Button>
          </Link>
          <Link href="/api/export/pdf">
            <Button variant="outline" size="sm">PDF</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
          <ThemeToggle />
          <Button variant="destructive" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
