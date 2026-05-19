/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          0: "#08090a",
          1: "#0c0d0f",
          2: "#131517",
        },
        line: {
          DEFAULT: "#1f2226",
          2: "#2a2e34",
        },
        ink: {
          0: "#f0f4fa",
          1: "#d8dde4",
          2: "#b0b6bd",
          3: "#8a8f96",
        },
        signal: {
          DEFAULT: "#f5b541",
          dim: "#f5b54122",
          bright: "#ffd479",
        },
        go: "#56d6a0",
        warn: "#ff6b5e",
      },
      fontFamily: {
        sans: ["Recursive", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        cap: "0.14em",
        tight: "-0.015em",
      },
    },
  },
  plugins: [],
};
