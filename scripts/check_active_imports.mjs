// scripts/check_active_imports.mjs
//
// F7: dependency-graph architecture gate. The prior guard checked direct
// import STRINGS with regexes, which misses transitive imports, alias
// resolutions (@/risk re-exported through a barrel), and dynamic imports
// assembled indirectly. This version parses every static and dynamic import,
// resolves each specifier to a real file (alias @/ -> src/, relative paths,
// .ts/.tsx/index extensions), builds the module dependency graph, and fails
// when any non-allowed ("active") source file transitively reaches an
// archived src/risk module.
//
// Allowed compatibility surfaces (which may import src/risk, and through which
// risk may be reached without flagging a dependent): the archived src/risk
// tree itself, the legacy figure/simulator bridges, and the dev-only figure
// harness under src/ui/testing.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve, dirname, normalize } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

// Named compatibility surfaces: these files/dirs MAY import src/risk and are
// the ONLY sanctioned route from active code into the archive.
const ALLOWED_FILES = new Set([
  "src/data/synthetic-iter3.ts",
  "src/ui/figures/CHIExplainer.tsx",
  "src/ui/figures/MissionComparison.tsx",
  "src/ui/views/Sim.tsx",
]);
const ALLOWED_DIRS = [
  "src/risk/",   // the archive itself
  "src/ui/testing/", // dev-only figure harness
];

function isAllowedRel(rel) {
  return (
    ALLOWED_FILES.has(rel) ||
    ALLOWED_DIRS.some((d) => rel.startsWith(d))
  );
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
}

// Capture both static `from "x"` and dynamic `import("x")` specifiers.
const IMPORT_RE = /(?:\bfrom\s*|import\s*\(\s*)["']([^"']+)["']/g;

function resolveSpecifier(specifier, importer) {
  if (specifier.startsWith("@/")) {
    return resolve(SRC, specifier.slice(2));
  }
  if (specifier.startsWith(".")) {
    return resolve(dirname(importer), specifier);
  }
  return null; // bare/external module (react, dexie, etc.) — not a repo file
}

function resolveToSource(absNoExt) {
  for (const ext of [".ts", ".tsx", ".d.ts", "/index.ts", "/index.tsx"]) {
    const cand = absNoExt.endsWith(ext) ? absNoExt : absNoExt + ext;
    if (existsSync(cand)) return cand;
  }
  return null;
}

const files = walk(SRC);
const relOf = (p) => relative(ROOT, p).replaceAll("\\", "/");

// Adjacency: file -> set of resolved source files it imports.
const graph = new Map();
for (const file of files) {
  const source = readFileSync(file, "utf8");
  const deps = new Set();
  for (const m of source.matchAll(IMPORT_RE)) {
    const spec = m[1];
    const base = resolveSpecifier(spec, file);
    if (!base) continue;
    // Try resolving with and without a trailing extension handling.
    const resolved = resolveToSource(base) ?? (existsSync(base) ? base : null);
    if (resolved && existsSync(resolved)) deps.add(resolved);
  }
  graph.set(file, deps);
}

function isRisk(p) {
  return relOf(p).startsWith("src/risk/");
}

// For each active file, BFS its import graph and detect any reachable
// src/risk file that is NOT reached solely through allowed compatibility.
function reachableRisk(start) {
  const seen = new Set([start]);
  const stack = [start];
  const hits = [];
  while (stack.length) {
    const cur = stack.pop();
    for (const dep of graph.get(cur) ?? []) {
      if (seen.has(dep)) continue;
      seen.add(dep);
      const drel = relOf(dep);
      if (isRisk(drel)) {
        hits.push(dep);
        continue; // reached a risk file — record, don't expand into the archive
      }
      if (isAllowedRel(drel)) continue; // compat shield: risk behind this is sanctioned
      stack.push(dep);
    }
  }
  return hits;
}

const violations = [];
for (const file of files) {
  const rel = relOf(file);
  if (isAllowedRel(rel)) continue; // compatibility surface may import risk
  const hits = reachableRisk(file);
  if (hits.length > 0) {
    violations.push({ file: rel, risk: hits.map(relOf) });
  }
}

if (violations.length > 0) {
  console.error(
    "Active source files must not transitively import archived src/risk modules:",
  );
  for (const v of violations) {
    console.error(`- ${v.file}  ->  ${v.risk.join(", ")}`);
  }
  process.exit(1);
}

console.log("Active import guard passed (transitive dependency-graph check).");