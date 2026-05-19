import { describe, expect, test } from "vitest";

import { SelectronError } from "@/engine/errors";
import { ANALOG_MISSIONS } from "@/data/analog-missions";
import { ANALOG_CONDITIONS } from "@/risk/conditions";
import type { PriorsJson } from "@/risk/priorsSchema";
import { runMissionTrial, simulateMission } from "@/risk/simulate";
import type { Candidate } from "@/types";
import { makeRng } from "@/engine/prng";

// ---- fixtures ----------------------------------------------------------------

function syntheticPriors(): PriorsJson {
  // 1000 thinned log_lambda samples ≈ N(log(0.0005), 0.3^2) — a per-person-day
  // rate of ~5×10⁻⁴ events / day for a "rate" condition. For "event" conditions
  // (e.g. musculoskeletal-injury, conflict-event, early-termination-request),
  // log_lambda is interpreted as log(p_event) per spec §3.2; we use a tighter
  // distribution centered at log(0.05) so the binomial trigger gives ~5% per EVA.
  const rng = makeRng(0xfeed);
  function makeRateSamples(mean: number, sd = 0.3): number[] {
    const out: number[] = new Array(1000);
    for (let i = 0; i < 1000; i++) {
      // Box–Muller for std normal
      const u1 = Math.max(rng(), 1e-12);
      const u2 = rng();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      out[i] = mean + sd * z;
    }
    return out;
  }
  const missionTypes = ["antarctic", "mars500", "hi-seas", "mdrs", "emmpol"] as const;
  const conditions: PriorsJson["conditions"] = {};
  for (const c of ANALOG_CONDITIONS) {
    const isEvent = c.kind === "event";
    const meanLog = isEvent ? Math.log(0.05) : Math.log(0.0005);
    const missions: PriorsJson["conditions"][string]["missions"] = {};
    for (const m of missionTypes) {
      const samples = makeRateSamples(meanLog);
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const variance =
        samples.reduce((a, b) => a + (b - mean) * (b - mean), 0) / samples.length;
      missions[m] = {
        log_lambda_samples: samples,
        mean_log_lambda: mean,
        sd_log_lambda: Math.sqrt(variance),
      };
    }
    conditions[c.id] = {
      missions,
      // Tiny positive β on emotional stability — high-stability candidates get
      // a small downward shift in λ via the multiplier exp(β·z) for z<0 inputs.
      // We use raw candidate scores (caller's responsibility to standardize);
      // for the unit tests β values are kept small to avoid runaway multipliers.
      vulnerability_beta:
        c.vulnerabilityCriteria.length > 0
          ? Object.fromEntries(
              c.vulnerabilityCriteria.map((cid) => [cid, c.family === "psychiatric" ? -0.05 : 0.0]),
            )
          : {},
      worst_case_prob_q: 0.25,
      treated_lost_days_mean: 1.0,
      untreated_lost_days_mean: 4.0,
    };
  }
  return {
    model_version: "test-iter3-v1",
    fitted_at: "2026-05-18T00:00:00Z",
    conditions,
  };
}

function syntheticCrew(n = 6): Candidate[] {
  const crew: Candidate[] = [];
  for (let i = 0; i < n; i++) {
    crew.push({
      id: `synth-${i}`,
      alias: `Candidate ${i}`,
      scores: {
        "psych.emotional_stability": 0.5,
        "behavioral.teamwork": 0.5,
        "physical.vo2max": 0.5,
        "psych.conscientiousness": 0.5,
      },
    });
  }
  return crew;
}

// ---- tests -------------------------------------------------------------------

describe("runMissionTrial", () => {
  test("returns CHI in [0,1] and QTL ≥ 0", () => {
    const priors = syntheticPriors();
    const crew = syntheticCrew(6);
    const mission = ANALOG_MISSIONS.find((m) => m.type === "mars500")!;
    const rng = makeRng(0xc0ffee);
    const r = runMissionTrial(crew, mission, priors, ANALOG_CONDITIONS, rng);
    expect(r.chi).toBeGreaterThanOrEqual(0);
    expect(r.chi).toBeLessThanOrEqual(1);
    expect(r.qtl).toBeGreaterThanOrEqual(0);
    for (const v of Object.values(r.perCondition)) {
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  test("perCondition sums equal qtl within float epsilon", () => {
    const priors = syntheticPriors();
    const crew = syntheticCrew(4);
    const mission = ANALOG_MISSIONS.find((m) => m.type === "antarctic")!;
    const rng = makeRng(0xface);
    const r = runMissionTrial(crew, mission, priors, ANALOG_CONDITIONS, rng);
    let sum = 0;
    for (const v of Object.values(r.perCondition)) sum += v;
    expect(Math.abs(sum - r.qtl)).toBeLessThan(1e-9);
  });

  test("missing mission prior for the chosen mission type yields zero contribution", () => {
    // Build priors that omit one mission type entirely.
    const priors = syntheticPriors();
    for (const cid of Object.keys(priors.conditions)) {
      delete priors.conditions[cid].missions["thor"];
    }
    const mission = {
      ...ANALOG_MISSIONS[0],
      id: "thor-test",
      type: "thor" as const,
      label: "THOR (no prior, regression guard)",
    };
    const crew = syntheticCrew(3);
    const rng = makeRng(0x1234);
    const r = runMissionTrial(crew, mission, priors, ANALOG_CONDITIONS, rng);
    expect(r.qtl).toBe(0);
    expect(r.chi).toBe(1);
  });
});

describe("simulateMission", () => {
  test("same seed → identical posterior (determinism)", () => {
    const priors = syntheticPriors();
    const crew = syntheticCrew(4);
    const mission = ANALOG_MISSIONS.find((m) => m.type === "mars500")!;
    const opts = { seed: 0xc0ffee, trials: 500 };
    const r1 = simulateMission(crew, mission, priors, ANALOG_CONDITIONS, opts);
    const r2 = simulateMission(crew, mission, priors, ANALOG_CONDITIONS, opts);
    expect(r1.chi.mean).toBe(r2.chi.mean);
    expect(r1.chi.ci90[0]).toBe(r2.chi.ci90[0]);
    expect(r1.chi.ci90[1]).toBe(r2.chi.ci90[1]);
    expect(r1.pEarlyTermination.mean).toBe(r2.pEarlyTermination.mean);
    expect(r1.expectedLostCrewDays.mean).toBe(r2.expectedLostCrewDays.mean);
  });

  test("returns mean and CI in [0,1] for CHI; CI90 ⊆ CI95", () => {
    const priors = syntheticPriors();
    const crew = syntheticCrew(6);
    const mission = ANALOG_MISSIONS.find((m) => m.type === "antarctic")!;
    const r = simulateMission(crew, mission, priors, ANALOG_CONDITIONS, {
      seed: 0xbeef,
      trials: 500,
    });
    expect(r.chi.mean).toBeGreaterThanOrEqual(0);
    expect(r.chi.mean).toBeLessThanOrEqual(1);
    expect(r.chi.ci90[0]).toBeLessThanOrEqual(r.chi.mean);
    expect(r.chi.ci90[1]).toBeGreaterThanOrEqual(r.chi.mean);
    expect(r.chi.ci95[0]).toBeLessThanOrEqual(r.chi.ci90[0]);
    expect(r.chi.ci95[1]).toBeGreaterThanOrEqual(r.chi.ci90[1]);
    expect(r.pEarlyTermination.mean).toBeGreaterThanOrEqual(0);
    expect(r.pEarlyTermination.mean).toBeLessThanOrEqual(1);
    expect(r.trials).toBe(500);
  });

  test("Myers 2018 convergence rule — σ change < 5% across last 1k increment (low-T smoke)", () => {
    // Spec §9 V&V Factor 1; plan Task 52 Step 2.
    // SMOKE TEST ONLY — verifies the rule is *applied* (samples plumbed,
    // σ computable, threshold reached) at T = 2000 with synthetic priors that
    // converge in tens of trials. The full 99k→100k boundary check at the
    // spec'd T = 100,000 is a Phase 3E acceptance step (Task 59) and would not
    // catch slow-mixing fits at this T. Treat a regression here as plumbing
    // breakage; treat the Task 59 run as the real convergence gate.
    const priors = syntheticPriors();
    const crew = syntheticCrew(3);
    const mission = ANALOG_MISSIONS.find((m) => m.type === "mdrs")!;
    const T = 2000;
    const r = simulateMission(crew, mission, priors, ANALOG_CONDITIONS, {
      seed: 0xab,
      trials: T,
      diagnostics: true,
    });
    // simulateMission's diagnostics field exposes the chi samples; compute σ
    // on [0:T-1000] and [0:T] and assert |Δσ|/σ < 5%.
    expect(r.diagnostics).toBeDefined();
    const samples = r.diagnostics!.chiSamples;
    expect(samples.length).toBe(T);
    function sigma(xs: number[]): number {
      const m = xs.reduce((a, b) => a + b, 0) / xs.length;
      const v = xs.reduce((a, b) => a + (b - m) * (b - m), 0) / xs.length;
      return Math.sqrt(v);
    }
    const sigmaEarly = sigma(samples.slice(0, T - 1000));
    const sigmaLate = sigma(samples.slice(0, T));
    // Guard the relative-change calc against σ_early ≈ 0 (degenerate case).
    if (sigmaEarly > 1e-9) {
      const rel = Math.abs(sigmaLate - sigmaEarly) / sigmaEarly;
      expect(rel).toBeLessThan(0.05);
    } else {
      expect(sigmaLate).toBeLessThan(1e-6);
    }
  });

  test("rejects malformed priors via priorsSchema", () => {
    const crew = syntheticCrew(2);
    const mission = ANALOG_MISSIONS[0];
    expect(() =>
      simulateMission(crew, mission, { foo: "bar" } as unknown as PriorsJson, ANALOG_CONDITIONS, {
        seed: 1,
        trials: 10,
      }),
    ).toThrow(SelectronError);
  });

  test("rejects non-positive trials", () => {
    const priors = syntheticPriors();
    const crew = syntheticCrew(2);
    const mission = ANALOG_MISSIONS[0];
    expect(() =>
      simulateMission(crew, mission, priors, ANALOG_CONDITIONS, { seed: 1, trials: 0 }),
    ).toThrow(SelectronError);
    expect(() =>
      simulateMission(crew, mission, priors, ANALOG_CONDITIONS, { seed: 1, trials: 1.5 }),
    ).toThrow(SelectronError);
  });

  test("higher chiStar increases pEarlyTermination monotonically", () => {
    const priors = syntheticPriors();
    const crew = syntheticCrew(6);
    const mission = ANALOG_MISSIONS.find((m) => m.type === "mars500")!;
    const low = simulateMission(crew, mission, priors, ANALOG_CONDITIONS, {
      seed: 0xb0b,
      trials: 500,
      chiStar: 0.3,
    });
    const high = simulateMission(crew, mission, priors, ANALOG_CONDITIONS, {
      seed: 0xb0b,
      trials: 500,
      chiStar: 0.95,
    });
    expect(high.pEarlyTermination.mean).toBeGreaterThanOrEqual(low.pEarlyTermination.mean);
  });
});
