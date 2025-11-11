import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const { user } = await getSession();
  if (user) redirect("/dashboard");

  return (
    <main className="flex flex-col items-center justify-center h-screen space-y-4">
      <h1 className="text-3xl font-bold">AI Budget Coach</h1>
      <p className="text-gray-600">Track spending & get insights.</p>
      <div className="flex gap-4">
        <Link href="/login" className="underline text-blue-600">Login</Link>
        <Link href="/register" className="underline text-blue-600">Create Account</Link>
      </div>
    </main>
  );
}
