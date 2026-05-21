// tests/imm/resource_coverage.test.ts
// Bug #3 guard: every required_resources key in imm-priors.json must exist in
// the issHMS kit (after resource-name normalisation). If this test fails, a new
// condition was added with a resource name that doesn't match any kit entry.
import { describe, it, expect } from "vitest";
import { IMM_KITS } from "../../src/imm/kits";
import { loadIMMPriors } from "../../src/imm/priors";

describe("Resource-name coverage", () => {
  it("every required_resources key exists in issHMS kit", () => {
    const priors = loadIMMPriors();
    const kitKeys = new Set(Object.keys(IMM_KITS.issHMS.resources));
    const unmatched: string[] = [];
    for (const [cid, p] of Object.entries(priors.conditions)) {
      for (const k of Object.keys(p.required_resources)) {
        if (!kitKeys.has(k)) unmatched.push(`${cid}: ${k}`);
      }
    }
    expect(unmatched, `Unmatched resource keys:\n${unmatched.join("\n")}`).toEqual([]);
  });

  it("unlimited kit is a superset of issHMS (unlimited covers everything issHMS covers)", () => {
    const issKeys = Object.keys(IMM_KITS.issHMS.resources);
    const unlimitedKeys = new Set(Object.keys(IMM_KITS.unlimited.resources));
    const missing = issKeys.filter(k => !unlimitedKeys.has(k));
    expect(missing, `unlimited kit missing keys from issHMS:\n${missing.join("\n")}`).toEqual([]);
  });
});
