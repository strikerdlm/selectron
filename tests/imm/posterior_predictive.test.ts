// tests/imm/posterior_predictive.test.ts
//
// Tests for posteriorPredictiveSimulateIMM — the posterior-predictive Monte
// Carlo wrapper around simulateIMM. The wrapper threads per-condition posterior
// λ draws into the engine as per-draw composite kind-multipliers (moment-matched
// to λ_d / E[λ]) with ZERO engine changes, so the K15 invariance canary holds.
//
// TDD: these were written before posterior-predictive.ts existed (module-not-found
// first, then green).

import { describe, it, expect } from "vitest";
import { posteriorPredictiveSimulateIMM } from "../../src/imm/posterior-predictive";
import { IMM_KITS } from "../../src/imm/kits";
import { IMM_MISSIONS } from "../../src/data/imm-missions";
import { loadIMMPriors } from "../../src/imm/priors";
import type { IMMMission, IMMCrewMember } from "../../src/imm/types";

const ISS_6MO = IMM_MISSIONS.find(m => m.id === "iss-6mo") as IMMMission;

// House crew fixture: 2 members (shape per IMMCrewMember, cf. simulate.test.ts).
const CREW: IMMCrewMember[] = [
  {
    id: "c1", sex: "male", contacts: false, crowns: false,
    CAC_positive: false, abdominal_surgery_history: false,
    EVA_eligible: true, EVA_count: 6,
  },
  {
    id: "c2", sex: "female", contacts: false, crowns: false,
    CAC_positive: false, abdominal_surgery_history: false,
    EVA_eligible: true, EVA_count: 6,
  },
];

/** Prior mean λ for a condition, mirroring the wrapper's resolution rules. */
function priorMeanLambda(cid: string): number {
  const inc = loadIMMPriors().conditions[cid].incidence;
  if (inc.distribution === "Gamma-Poisson") return (inc.alpha as number) / (inc.beta as number);
  if (inc.distribution === "Lognormal-Poisson") {
    const mu = inc.mu_log_lambda as number;
    const sigma = inc.sigma_log_lambda as number;
    return Math.exp(mu + (sigma * sigma) / 2);
  }
  if (inc.distribution === "Fixed") return inc.lambda_fixed as number;
  throw new Error(`no point mean for ${cid} (${inc.distribution})`);
}

/** Build a length-n posterior draws array of constant value `lambda`. */
function constDraws(lambda: number, n: number): number[] {
  return Array.from({ length: n }, () => lambda);
}

describe("posteriorPredictiveSimulateIMM", () => {
  // (a) Well-formed output -----------------------------------------------------
  it("returns a well-formed PosteriorPredictiveOutcome", () => {
    const nDraws = 8;
    const trialsPerDraw = 200;
    // Posterior built from prior means: lams[d] = m * scale[d], spanning 0.5×..2×.
    const scales = [0.5, 0.8, 1.0, 1.2, 0.7, 1.1, 0.9, 1.3];
    const conds = ["acute-sinusitis", "diarrhea", "skin-infection"];
    const posterior: Record<string, number[]> = {};
    for (const c of conds) {
      const m = priorMeanLambda(c);
      posterior[c] = scales.map(s => m * s);
    }

    const out = posteriorPredictiveSimulateIMM({
      crew: CREW, mission: ISS_6MO, kit: IMM_KITS.none,
      posterior, nDraws, trialsPerDraw, seed: 0xC0FFEE,
    });

    expect(out.nDraws).toBe(nDraws);
    expect(out.trialsPerDraw).toBe(trialsPerDraw);

    for (const s of [out.pEvacPost, out.pLoclPost, out.chiPost]) {
      expect(s.mean).toBeGreaterThanOrEqual(0);
      expect(s.mean).toBeLessThanOrEqual(100);
      expect(s.ci90[0]).toBeLessThanOrEqual(s.ci90[1]);
      expect(s.ci95[0]).toBeLessThanOrEqual(s.ci95[1]);
      expect(s.sd).toBeGreaterThanOrEqual(0);
    }
    // Per-condition posterior must include the conditions we elevated.
    for (const c of conds) {
      expect(out.perConditionTmeContribPost[c]).toBeDefined();
    }
  });

  // (b) Deterministic from seed ------------------------------------------------
  it("is deterministic from seed (bit-reproducible engine)", () => {
    const m = priorMeanLambda("acute-sinusitis");
    const posterior = { "acute-sinusitis": constDraws(m, 6) };
    const args = {
      crew: CREW, mission: ISS_6MO, kit: IMM_KITS.none,
      posterior, nDraws: 6, trialsPerDraw: 150, seed: 0xABCDEF,
    };
    const a = posteriorPredictiveSimulateIMM(args);
    const b = posteriorPredictiveSimulateIMM(args);
    expect(a.pEvacPost.mean).toBe(b.pEvacPost.mean);
    expect(a.pLoclPost.mean).toBe(b.pLoclPost.mean);
    expect(a.chiPost.mean).toBe(b.chiPost.mean);
  });

  // (c) LOAD-BEARING: the posterior actually propagates ------------------------
  //
  // Elevate two high-incidence conditions (acute-sinusitis ~3581/1000PY,
  // diarrhea ~1605/1000PY) by 5× their prior mean and confirm both the
  // per-condition TME contribution AND a downstream metric (CHI) move.
  //
  // This MUST fail against any implementation that ignores `posterior` — that
  // is the test's purpose. The empirical probe (kit=none, iss-6mo, 2 crew,
  // nDraws 8 × trialsPerDraw 200) gave: sinTme A≈3.55→B≈17.5 (ratio ~4.9),
  // CHI A≈80.1→B≈69.0 (Δ≈-11). Both margins dwarf MC noise at these sizes.
  it("propagates posterior draws into per-condition TME and downstream CHI", () => {
    const CID = "acute-sinusitis";
    const conds = [CID, "diarrhea"];
    const nDraws = 8;
    const trialsPerDraw = 200;
    const seed = 0xC0FFEE;

    function postAt(multiple: number): Record<string, number[]> {
      const p: Record<string, number[]> = {};
      for (const c of conds) p[c] = constDraws(priorMeanLambda(c) * multiple, nDraws);
      return p;
    }

    const A = posteriorPredictiveSimulateIMM({
      crew: CREW, mission: ISS_6MO, kit: IMM_KITS.none,
      posterior: postAt(1), nDraws, trialsPerDraw, seed,
    });
    const B = posteriorPredictiveSimulateIMM({
      crew: CREW, mission: ISS_6MO, kit: IMM_KITS.none,
      posterior: postAt(5), nDraws, trialsPerDraw, seed,
    });

    // The point-prior (1×) run must already register events on this condition,
    // so the ratio below is meaningful.
    expect(A.perConditionTmeContribPost[CID].mean).toBeGreaterThan(0);
    // 5× the posterior mean → > 2× the TME contribution (margin, not exact 5×).
    expect(B.perConditionTmeContribPost[CID].mean).toBeGreaterThan(
      2 * A.perConditionTmeContribPost[CID].mean,
    );
    // Downstream: more illness → lower Crew Health Index. CHI is the most
    // responsive metric at these sizes (Δ≈-11 in the probe; far beyond noise).
    expect(B.chiPost.mean).toBeLessThan(A.chiPost.mean);
  });

  // (d) Composes with explicit kindMultipliers ---------------------------------
  //
  // Passing kindMultipliers: { [CID]: 0 } zeroes the base multiplier for that
  // condition; the composite stays 0 (0 × anything), so the condition produces
  // no events and contributes nothing.
  it("composes with explicit kindMultipliers (zeroing suppresses the condition)", () => {
    const CID = "acute-sinusitis";
    const nDraws = 8;
    const trialsPerDraw = 200;
    const posterior = { [CID]: constDraws(priorMeanLambda(CID) * 5, nDraws) };

    const out = posteriorPredictiveSimulateIMM({
      crew: CREW, mission: ISS_6MO, kit: IMM_KITS.none,
      posterior, nDraws, trialsPerDraw, seed: 0xC0FFEE,
      kindMultipliers: { [CID]: 0 },
    });

    const s = out.perConditionTmeContribPost[CID];
    // Union-fill records 0 for draws with no events; with the base zeroed,
    // every draw contributes 0, so the summary mean is exactly 0 (present or absent).
    if (s !== undefined) {
      expect(s.mean).toBe(0);
    }
  });

  // (e) Contract errors --------------------------------------------------------
  it("throws when a posterior array is shorter than nDraws", () => {
    const m = priorMeanLambda("acute-sinusitis");
    expect(() =>
      posteriorPredictiveSimulateIMM({
        crew: CREW, mission: ISS_6MO, kit: IMM_KITS.none,
        posterior: { "acute-sinusitis": constDraws(m, 4) },
        nDraws: 8, trialsPerDraw: 100, seed: 0,
      }),
    ).toThrow();
  });

  it("throws when nDraws <= 0", () => {
    expect(() =>
      posteriorPredictiveSimulateIMM({
        crew: CREW, mission: ISS_6MO, kit: IMM_KITS.none,
        posterior: {}, nDraws: 0, trialsPerDraw: 100, seed: 0,
      }),
    ).toThrow();
  });

  it("throws when trialsPerDraw <= 0", () => {
    expect(() =>
      posteriorPredictiveSimulateIMM({
        crew: CREW, mission: ISS_6MO, kit: IMM_KITS.none,
        posterior: {}, nDraws: 4, trialsPerDraw: 0, seed: 0,
      }),
    ).toThrow();
  });
});
