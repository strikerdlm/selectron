import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
// @ts-ignore check_active_imports.mjs is a Node ESM script with runtime exports.
import { analyzeActiveImports, collectImportSpecifiers } from "../../scripts/check_active_imports.mjs";

let tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots) rmSync(root, { recursive: true, force: true });
  tempRoots = [];
});

function fixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "selectron-import-guard-"));
  tempRoots.push(root);
  for (const [rel, source] of Object.entries(files)) {
    const path = join(root, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, source, "utf8");
  }
  return root;
}

describe("check_active_imports architecture guard", () => {
  it("collects static, side-effect, export-from, require, dynamic, and import-type specifiers", () => {
    const source = `
      import value from "@/risk/static";
      import type { T } from "@/risk/type-only";
      import "@/risk/side-effect";
      export { archived } from "@/risk/export-named";
      export * from "@/risk/export-all";
      import archived = require("@/risk/import-equals");
      const loaded = import("@/risk/dynamic");
      type Imported = import("@/risk/import-type").Thing;
    `;

    expect(collectImportSpecifiers(source, "fixture.ts").specifiers.sort()).toEqual([
      "@/risk/dynamic",
      "@/risk/export-all",
      "@/risk/export-named",
      "@/risk/import-equals",
      "@/risk/import-type",
      "@/risk/side-effect",
      "@/risk/static",
      "@/risk/type-only",
    ]);
  });

  it("flags a side-effect import of archived risk code from active source", () => {
    const root = fixture({
      "src/risk/some-module.ts": "export const archived = 1;",
      "src/active/side-effect.ts": 'import "@/risk/some-module";\nexport const ok = true;',
    });

    const result = analyzeActiveImports({ root });

    expect(result.violations).toEqual([
      {
        file: "src/active/side-effect.ts",
        risk: ["src/risk/some-module.ts"],
      },
    ]);
    expect(result.computedDynamicImports).toEqual([]);
  });

  it("flags a literal dynamic import of archived risk code from active source", () => {
    const root = fixture({
      "src/risk/some-module.ts": "export const archived = 1;",
      "src/active/dynamic.ts": 'export async function load() { return import("@/risk/some-module"); }',
    });

    const result = analyzeActiveImports({ root });

    expect(result.violations).toEqual([
      {
        file: "src/active/dynamic.ts",
        risk: ["src/risk/some-module.ts"],
      },
    ]);
    expect(result.computedDynamicImports).toEqual([]);
  });

  it("flags transitive active dependencies that reach archived risk code", () => {
    const root = fixture({
      "src/risk/some-module.ts": "export const archived = 1;",
      "src/active/helper.ts": 'import { archived } from "@/risk/some-module";\nexport const x = archived;',
      "src/active/app.ts": 'import { x } from "@/active/helper";\nexport const y = x;',
    });

    const result = analyzeActiveImports({ root });

    expect(result.violations).toEqual([
      {
        file: "src/active/app.ts",
        risk: ["src/risk/some-module.ts"],
      },
      {
        file: "src/active/helper.ts",
        risk: ["src/risk/some-module.ts"],
      },
    ]);
    expect(result.computedDynamicImports).toEqual([]);
  });

  it("fails closed on computed dynamic imports in active source", () => {
    const root = fixture({
      "src/risk/some-module.ts": "export const archived = 1;",
      "src/active/computed.ts": 'const target = "@/risk/some-module";\nexport const load = () => import(target);',
    });

    const result = analyzeActiveImports({ root });

    expect(result.violations).toEqual([]);
    expect(result.computedDynamicImports).toEqual([
      {
        file: "src/active/computed.ts",
        line: 2,
        column: 27,
      },
    ]);
  });

  it("preserves the explicit compatibility shield for legacy bridge files", () => {
    const root = fixture({
      "src/risk/some-module.ts": "export const archived = 1;",
      "src/ui/figures/MissionComparison.tsx": 'import "@/risk/some-module";\nexport const x = 1;',
      "src/active/app.ts": 'import { x } from "@/ui/figures/MissionComparison";\nexport const y = x;',
    });

    const result = analyzeActiveImports({ root });

    expect(result.violations).toEqual([]);
    expect(result.computedDynamicImports).toEqual([]);
  });
});
