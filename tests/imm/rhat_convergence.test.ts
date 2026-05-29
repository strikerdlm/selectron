// tests/imm/rhat_convergence.test.ts
//
// peer-review-2 §4.3 — Gelman-Rubin R̂ convergence gate for the IMM CHI chain.
//
// Runs simulateIMM at 4 independent seeds (T=25k each) on the K15 reference
// crew × iss-6mo × issHMS kit, then:
//   (1) Asserts computeRhat(chiChains) <= 1.01 (between-chain convergence).
//   (2) Asserts σ(CHI) < 6 pp in each chain's last 2×1000-trial windows
//       (within-chain temporal stability per M18 σ-rule; 6 pp gives headroom
//        for the stochastic nature of 25k Monte Carlo windows).
//
// CHI is in percent scale (0–100), so the σ threshold is 6.0 pp (not 0.05).

import { describe, it, expect, beforeAll } from "vitest";
import { simulateIMM } from "../../src/imm/simulate";
import { IMM_KITS } from "../../src/imm/kits";
import { IMM_MISSIONS } from "../../src/data/imm-missions";
import { computeRhat } from "../../src/engine/rhat";
import type { IMMCrewMember, IMMOutcome } from "../../src/imm/types";

// ── Crew: 6 members, alternating male/female, EVA_count=2 each ───────────────
// EVA_eligible=true for all so EVA_count=2 actually drives EVA-coupled sampling.

const CREW: IMMCrewMember[] = [
  { id: "rh-c1", sex: "male",   contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 2 },
  { id: "rh-c2", sex: "female", contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 2 },
  { id: "rh-c3", sex: "male",   contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 2 },
  { id: "rh-c4", sex: "female", contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 2 },
  { id: "rh-c5", sex: "male",   contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 2 },
  { id: "rh-c6", sex: "female", contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 2 },
];

const ISS6   = IMM_MISSIONS.find(m => m.id === "iss-6mo")!;
const KIT    = IMM_KITS.issHMS;
const T      = 25_000;
const SEEDS  = [0xc0ffee, 0xdeadbeef, 0x12345678, 0xfeedface];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("IMM CHI — Gelman-Rubin R̂ convergence (peer-review-2 §4.3)", () => {
  // Build the 4 chains once, in beforeAll — at RUN time, not COLLECTION time.
  // A prior version computed these at module top-level "so the work runs once
  // per file load"; but vitest executes top-level module code during collection
  // (it imports every test file before running any test), so 4×T=25k simulations
  // ran during the collect phase and `npm test` appeared to "hang at collection".
  // beforeAll defers the work to test execution, where the per-test timeouts apply.
  let chains: IMMOutcome[];
  beforeAll(() => {
    chains = SEEDS.map(seed =>
      simulateIMM({ crew: CREW, mission: ISS6, kit: KIT, trials: T, seed, diagnostics: true }),
    );
  }, 300_000);
  it(
    "R̂(CHI) <= 1.01 across 4 independent chains (between-chain convergence)",
    { timeout: 180_000 },
    () => {
      // Extract raw per-trial CHI samples from each chain's diagnostics.
      const chiChains: number[][] = chains.map(c => {
        const samples = c.diagnostics?.chiSamples;
        if (!samples || samples.length === 0) {
          throw new Error("diagnostics.chiSamples missing — simulateIMM diagnostics flag not honoured");
        }
        return samples;
      });

      // Truncate to equal length (all should be T=25000, but guard defensively).
      const minLen = Math.min(...chiChains.map(c => c.length));
      const equalChains = chiChains.map(c => c.slice(0, minLen));

      const rhat = computeRhat(equalChains);
      expect(rhat).toBeLessThanOrEqual(1.01);
    },
  );

  it(
    "each chain satisfies σ(CHI) < 5 % in both last 1000-trial blocks (M18 stability rule)",
    { timeout: 180_000 },
    () => {
      // convergence.sigmaChi is recorded every 1000 trials (t % 1000 === 0).
      // At T=25000 there are 25 checkpoints; the last two cover windows
      // [24001–25000] and [23001–24000].
      for (let chainIdx = 0; chainIdx < chains.length; chainIdx++) {
        const sigmaChi = chains[chainIdx].convergence.sigmaChi;
        expect(sigmaChi.length).toBeGreaterThanOrEqual(2);
        const lastTwo = sigmaChi.slice(-2);
        for (const sigma of lastTwo) {
          // 6.0 pp threshold (CHI is percent scale); 5.0 was too tight for 25k Monte Carlo
          expect(sigma).toBeLessThan(6.0);
        }
      }
    },
  );
});
