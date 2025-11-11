"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Until mounted, render a visually-hidden placeholder to avoid SSR/CSR mismatch
  if (!mounted) {
    return (
      <Button variant="outline" size="icon" aria-label="Toggle theme" className="opacity-0">
        🌓
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";
  const next = isDark ? "light" : "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(next)}
    >
      {isDark ? "🌙" : "☀️"}
    </Button>
  );
}
