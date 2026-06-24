import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { execFileSync } from "node:child_process";

function resolveSourceCommit(): string {
  const explicit = process.env.VITE_GIT_COMMIT?.trim();
  if (explicit) return explicit;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: __dirname,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

const sourceCommit = resolveSourceCommit();
process.env.VITE_GIT_COMMIT = sourceCommit;

export default defineConfig({
  plugins: [react()],
  define: {
    __SELECTRON_SOURCE_COMMIT__: JSON.stringify(sourceCommit),
    "import.meta.env.VITE_GIT_COMMIT": JSON.stringify(sourceCommit),
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
