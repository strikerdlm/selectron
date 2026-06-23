import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

const ALLOWED_RISK_IMPORT_PREFIXES = [
  "src/risk/",
  "src/ui/testing/",
];

const ALLOWED_RISK_IMPORT_FILES = new Set([
  "src/data/synthetic-iter3.ts",
  "src/ui/figures/CHIExplainer.tsx",
  "src/ui/figures/MissionComparison.tsx",
  "src/ui/views/Sim.tsx",
]);

const ACTIVE_FORBIDDEN_PATTERNS = [
  /from\s+["']@\/risk\//,
  /import\s*\(\s*["']@\/risk\//,
  /from\s+["'](?:\.\.\/)+risk\//,
  /import\s*\(\s*["'](?:\.\.\/)+risk\//,
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) {
      walk(path, out);
    } else if (/\.(ts|tsx)$/.test(name)) {
      out.push(path);
    }
  }
  return out;
}

function isAllowed(path) {
  const rel = relative(ROOT, path).replaceAll("\\", "/");
  return (
    ALLOWED_RISK_IMPORT_FILES.has(rel) ||
    ALLOWED_RISK_IMPORT_PREFIXES.some((prefix) => rel.startsWith(prefix))
  );
}

const violations = [];
for (const file of walk(SRC)) {
  if (isAllowed(file)) continue;
  const rel = relative(ROOT, file).replaceAll("\\", "/");
  const source = readFileSync(file, "utf8");
  for (const pattern of ACTIVE_FORBIDDEN_PATTERNS) {
    if (pattern.test(source)) {
      violations.push(rel);
      break;
    }
  }
}

if (violations.length > 0) {
  console.error("Active source files must not import archived src/risk modules:");
  for (const file of violations) console.error(`- ${file}`);
  process.exit(1);
}

console.log("Active import guard passed.");
