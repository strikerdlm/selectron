import { defineConfig } from "vitest/config";
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
  define: {
    __SELECTRON_SOURCE_COMMIT__: JSON.stringify(sourceCommit),
    "import.meta.env.VITE_GIT_COMMIT": JSON.stringify(sourceCommit),
  },
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
