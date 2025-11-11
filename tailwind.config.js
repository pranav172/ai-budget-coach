/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",                // ✅ enable class-based dark mode
    content: ["./src/**/*.{ts,tsx,js,jsx}"], // safe even on v4
    theme: { extend: {} },
    plugins: [],
  };
  