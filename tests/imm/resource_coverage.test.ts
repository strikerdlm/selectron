// tests/imm/resource_coverage.test.ts
// Bug #3 guard: every required_resources key in imm-priors.json must exist in
// the issHMS kit (after resource-name normalisation), OR be explicitly listed
// in UNCOVERABLE_BY_DESIGN — capabilities that are genuinely not on the ISS
// HMS (e.g., hyperbaric oxygen). For uncoverable-by-design keys, runIMMTrial
// correctly produces RAF=0 and the condition falls through to the untreated
// path, which is the physically accurate outcome.
//
// If this test fails, either (a) a new condition was added with a generic
// resource name that needs to be added to RENAME_MAP in
// scripts/normalize_resource_names.ts and the script re-run, or (b) a new
// genuinely-uncoverable capability needs to be added to UNCOVERABLE_BY_DESIGN
// below.
import { describe, it, expect } from "vitest";
import { IMM_KITS } from "../../src/imm/kits";
import { loadIMMPriors } from "../../src/imm/priors";

// Capabilities not present on the ISS HMS. priors-rev3-a (2026-05-22) audit.
// Keep in sync with UNCOVERABLE_BY_DESIGN in scripts/normalize_resource_names.ts.
const UNCOVERABLE_BY_DESIGN = new Set<string>([
  "imaging",              // diagnostic imaging not in HMS (head-injury, VIIP)
  "hyperbaric-oxygen",    // no hyperbaric chamber on ISS (DCS-EVA)
  "audiometry",           // no audiometer (hearing-loss)
  "blood-products",       // no blood bank (traumatic-hypovolemic-shock)
  "antidote",             // generic placeholder (medication-overdose)
  "pelvic-floor-trainer", // not in HMS (urinary-incontinence)
]);

describe("Resource-name coverage", () => {
  it("every required_resources key exists in issHMS kit (or is uncoverable by design)", () => {
    const priors = loadIMMPriors();
    const kitKeys = new Set(Object.keys(IMM_KITS.issHMS.resources));
    const unmatched: string[] = [];
    for (const [cid, p] of Object.entries(priors.conditions)) {
      for (const k of Object.keys(p.required_resources)) {
        if (!kitKeys.has(k) && !UNCOVERABLE_BY_DESIGN.has(k)) {
          unmatched.push(`${cid}: ${k}`);
        }
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
