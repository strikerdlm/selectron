// scripts/check_active_imports.mjs
//
// F7: dependency-graph architecture gate. This guard parses TypeScript source
// with the compiler API, resolves static imports, side-effect imports, literal
// dynamic imports, export-from declarations, import-equals require forms, and
// import("./type") references. It then builds a transitive module graph and
// fails when any non-allowed ("active") source file reaches an archived
// src/risk module. Computed dynamic imports in active source files fail closed
// because the target cannot be resolved statically.
//
// Allowed compatibility surfaces (which may import src/risk, and through which
// risk may be reached without flagging a dependent): the archived src/risk
// tree itself, the legacy figure/simulator bridges, and the dev-only figure
// harness under src/ui/testing.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative, resolve, dirname, normalize } from "node:path";
import ts from "typescript";

const DEFAULT_ROOT = process.cwd();

// Named compatibility surfaces: these files/dirs MAY import src/risk and are
// the ONLY sanctioned route from active code into the archive.
const DEFAULT_ALLOWED_FILES = [
  "src/data/synthetic-iter3.ts",
  "src/ui/figures/CHIExplainer.tsx",
  "src/ui/figures/MissionComparison.tsx",
  "src/ui/views/Sim.tsx",
];
const DEFAULT_ALLOWED_DIRS = [
  "src/risk/",   // the archive itself
  "src/ui/testing/", // dev-only figure harness
];

function normalizeRel(path) {
  return path.replaceAll("\\", "/");
}

function isAllowedRel(rel, allowedFiles, allowedDirs) {
  return (
    allowedFiles.has(rel) ||
    allowedDirs.some((d) => rel.startsWith(d))
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

function isStringLiteralLike(node) {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
}

function lineAndColumn(sourceFile, node) {
  const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return { line: pos.line + 1, column: pos.character + 1 };
}

export function collectImportSpecifiers(source, fileName = "source.ts") {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const specifiers = [];
  const computedDynamicImports = [];

  function addSpecifier(node) {
    if (node && isStringLiteralLike(node)) specifiers.push(node.text);
  }

  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      addSpecifier(node.moduleSpecifier);
    } else if (ts.isImportEqualsDeclaration(node)) {
      const ref = node.moduleReference;
      if (ts.isExternalModuleReference(ref)) addSpecifier(ref.expression);
    } else if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const arg = node.arguments[0];
        if (arg && isStringLiteralLike(arg)) {
          specifiers.push(arg.text);
        } else {
          computedDynamicImports.push(lineAndColumn(sourceFile, node));
        }
      } else if (
        ts.isIdentifier(node.expression) &&
        node.expression.text === "require" &&
        node.arguments.length > 0
      ) {
        addSpecifier(node.arguments[0]);
      }
    } else if (ts.isImportTypeNode(node)) {
      const arg = node.argument;
      if (ts.isLiteralTypeNode(arg)) addSpecifier(arg.literal);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return { specifiers, computedDynamicImports };
}

function resolveSpecifier(specifier, importer, srcRoot) {
  if (specifier.startsWith("@/")) {
    return resolve(srcRoot, specifier.slice(2));
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

function isRiskRel(rel) {
  return rel.startsWith("src/risk/");
}

export function analyzeActiveImports(options = {}) {
  const root = options.root ?? DEFAULT_ROOT;
  const srcRoot = options.srcRoot ?? join(root, "src");
  const allowedFiles = new Set(options.allowedFiles ?? DEFAULT_ALLOWED_FILES);
  const allowedDirs = options.allowedDirs ?? DEFAULT_ALLOWED_DIRS;
  const relOf = (p) => normalizeRel(relative(root, p));
  const files = walk(srcRoot);

  // Adjacency: file -> set of resolved source files it imports.
  const graph = new Map();
  const computedDynamicImports = [];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const { specifiers, computedDynamicImports: computed } = collectImportSpecifiers(source, file);
    const deps = new Set();
    for (const spec of specifiers) {
      const base = resolveSpecifier(spec, file, srcRoot);
      if (!base) continue;
      const resolved = resolveToSource(base) ?? (existsSync(base) ? base : null);
      if (resolved && existsSync(resolved)) deps.add(resolved);
    }
    graph.set(file, deps);
    const rel = relOf(file);
    if (!isAllowedRel(rel, allowedFiles, allowedDirs)) {
      for (const hit of computed) computedDynamicImports.push({ file: rel, ...hit });
    }
  }

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
        if (isRiskRel(drel)) {
          hits.push(dep);
          continue; // reached a risk file — record, don't expand into the archive
        }
        if (isAllowedRel(drel, allowedFiles, allowedDirs)) continue; // compat shield
        stack.push(dep);
      }
    }
    return hits;
  }

  const violations = [];
  for (const file of files) {
    const rel = relOf(file);
    if (isAllowedRel(rel, allowedFiles, allowedDirs)) continue;
    const hits = reachableRisk(file);
    if (hits.length > 0) {
      violations.push({ file: rel, risk: hits.map(relOf) });
    }
  }

  return { violations, computedDynamicImports };
}

function main() {
  const { violations, computedDynamicImports } = analyzeActiveImports();

  if (violations.length > 0 || computedDynamicImports.length > 0) {
    if (violations.length > 0) {
      console.error(
        "Active source files must not transitively import archived src/risk modules:",
      );
      for (const v of violations) {
        console.error(`- ${v.file}  ->  ${v.risk.join(", ")}`);
      }
    }
    if (computedDynamicImports.length > 0) {
      console.error(
        "Active source files must not use computed dynamic imports; targets cannot be resolved by the architecture guard:",
      );
      for (const v of computedDynamicImports) {
        console.error(`- ${v.file}:${v.line}:${v.column}`);
      }
    }
    process.exit(1);
  }

  console.log("Active import guard passed (TypeScript AST transitive dependency-graph check).");
}

if (process.argv[1] && normalize(fileURLToPath(import.meta.url)) === normalize(process.argv[1])) {
  main();
}
