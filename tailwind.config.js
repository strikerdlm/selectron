/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          0: "rgb(var(--bg-0) / <alpha-value>)",
          1: "rgb(var(--bg-1) / <alpha-value>)",
          2: "rgb(var(--bg-2) / <alpha-value>)",
        },
        line: {
          DEFAULT: "rgb(var(--line) / <alpha-value>)",
          2: "rgb(var(--line-2) / <alpha-value>)",
        },
        ink: {
          0: "rgb(var(--ink-0) / <alpha-value>)",
          1: "rgb(var(--ink-1) / <alpha-value>)",
          2: "rgb(var(--ink-2) / <alpha-value>)",
          3: "rgb(var(--ink-3) / <alpha-value>)",
        },
        signal: {
          DEFAULT: "rgb(var(--signal) / <alpha-value>)",
          dim: "var(--signal-dim)",
          bright: "rgb(var(--signal-bright) / <alpha-value>)",
        },
        go: "rgb(var(--go) / <alpha-value>)",
        warn: "rgb(var(--warn) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Recursive", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        xs:   ["0.875rem", { lineHeight: "1.25rem" }],  // 14px (was 12)
        sm:   ["1rem",     { lineHeight: "1.5rem" }],    // 16px (was 14)
        base: ["1.125rem", { lineHeight: "1.75rem" }],   // 18px (was 16)
        lg:   ["1.25rem",  { lineHeight: "1.875rem" }],  // 20px (was 18)
        xl:   ["1.375rem", { lineHeight: "2rem" }],      // 22px (was 20)
        "2xl":["1.625rem", { lineHeight: "2.125rem" }],  // 26px (was 24)
        "3xl":["1.875rem", { lineHeight: "2.25rem" }],   // 30px (was 30 → keep generous)
      },
      letterSpacing: {
        cap: "0.14em",
        tight: "-0.015em",
      },
    },
  },
  plugins: [],
};
