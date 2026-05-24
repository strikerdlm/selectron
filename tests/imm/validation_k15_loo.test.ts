// tests/imm/validation_k15_loo.test.ts
//
// peer-review-2 §4.5 — Leave-calibrated-out (LOO) sensitivity analysis.
//
// Demonstrates how K15 reproduction degrades when calibration-target-circular
// conditions are removed, leaving only the 41 tier-A-nasa (directly NASA-
// attributed) plus the 3 rev3-c source-cited tier-B conditions that received
// per-condition Earth-analog calibration (depression, respiratory-infection,
// skin-rash). Tier-B blanket-multiplier conditions (37 of 41 tier-B) and all
// 18 tier-C back-fit conditions are excluded.
//
// Expected:
//   - TME drops (fewer active conditions → fewer Poisson draws → fewer events)
//   - CHI rises (QTL falls with fewer events → crew health time fraction rises)
//
// Note: tier multipliers from global_calibration still apply to the filtered
// subset — this is intentional. The point is to show that removing the
// calibration-circular conditions degrades reproduction even when the tier
// scalars are left unchanged.

import { describe, it, expect } from "vitest";
import { simulateIMM } from "../../src/imm/simulate";
import { IMM_KITS } from "../../src/imm/kits";
import { IMM_MISSIONS } from "../../src/data/imm-missions";
import { IMM_CONDITIONS } from "../../src/imm/conditions";
import { loadIMMPriors } from "../../src/imm/priors";
import type { IMMCrewMember } from "../../src/imm/types";

// K15 reference crew — same as validation_k15.test.ts for comparability.
const K15_CREW: IMMCrewMember[] = [
  { id: "k15-c1", sex: "male",   contacts: true,  crowns: true,  CAC_positive: true,  abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 6 },
  { id: "k15-c2", sex: "male",   contacts: true,  crowns: true,  CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 6 },
  { id: "k15-c3", sex: "male",   contacts: true,  crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: false, EVA_count: 0 },
  { id: "k15-c4", sex: "male",   contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: false, EVA_count: 0 },
  { id: "k15-c5", sex: "female", contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: false, EVA_count: 0 },
  { id: "k15-c6", sex: "female", contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 0 },
];

describe("Leave-calibrated-out K15 sensitivity", () => {
  const priors = loadIMMPriors();
  const issHMS = IMM_MISSIONS.find((m) => m.id === "iss-6mo")!;

  // Evidence-based condition set:
  //   tier-A-nasa (41): directly NASA-attributed incidence from K15/M18/G12/TM21/S20/A22.
  //   rev3-c source-cited tier-B (3): conditions that received per-condition Earth-analog
  //     calibration from primary literature in rev3-c:
  //     - depression (Palinkas 2004 Antarctic, Hong 2022, Bhatia 2012)
  //     - respiratory-infection (Bhatia 2012 Maitri, Pattarini 2016 McMurdo)
  //     - skin-rash (Pattarini 2016, WOTR15)
  //   dental-caries and late-insomnia were promoted / kept at tier-A, not tier-B.
  //
  // Excluded (54 conditions):
  //   - 38 tier-B conditions that rely on the blanket tierB_multiplier=0.55 fallback
  //   - 18 tier-C conditions back-fit directly against K15 Table 1 aggregate output
  const REV3C_SOURCE_CITED_TIERB = new Set([
    "depression",
    "respiratory-infection",
    "skin-rash",
  ]);

  const evidenceBasedIds = new Set(
    IMM_CONDITIONS
      .filter((c) => {
        const p = priors.conditions[c.id];
        if (!p) return false;
        if (p.provenance === "tierA-nasa") return true;
        if (p.provenance === "tierB-lit" && REV3C_SOURCE_CITED_TIERB.has(c.id)) return true;
        return false;
      })
      .map((c) => c.id)
  );

  it("includes 41–46 evidence-based conditions (41 tier-A + up to 5 source-cited tier-B)", () => {
    expect(evidenceBasedIds.size).toBeGreaterThanOrEqual(41);
    expect(evidenceBasedIds.size).toBeLessThanOrEqual(46);
  });

  it("TME drops and CHI rises when calibration-circular conditions are removed", () => {
    const full = simulateIMM({
      crew: K15_CREW,
      mission: issHMS,
      kit: IMM_KITS.issHMS,
      trials: 25_000,
      seed: 0xc0ffee,
    });
    const reduced = simulateIMM({
      crew: K15_CREW,
      mission: issHMS,
      kit: IMM_KITS.issHMS,
      trials: 25_000,
      seed: 0xc0ffee,
      conditionFilter: (c) => evidenceBasedIds.has(c.id),
    });
    console.log(`Full (${IMM_CONDITIONS.length} conditions): TME=${full.tme.mean.toFixed(1)}, CHI=${full.chi.mean.toFixed(1)}%`);
    console.log(`Evidence-only (${evidenceBasedIds.size} conditions): TME=${reduced.tme.mean.toFixed(1)}, CHI=${reduced.chi.mean.toFixed(1)}%`);
    expect(reduced.tme.mean).toBeLessThan(full.tme.mean);
    expect(reduced.chi.mean).toBeGreaterThan(full.chi.mean);
  });
}, 120_000);
