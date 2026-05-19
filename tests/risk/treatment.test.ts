import { describe, it, expect } from "vitest";
import { lostDays } from "@/risk/treatment";
import { validatePriorsJson, type PriorsJson } from "@/risk/priorsSchema";
import { SelectronError } from "@/engine/errors";

describe("lostDays partial-credit interpolation", () => {
  it("τ=0 returns the untreated extreme", () => {
    expect(lostDays(14, 3, 0)).toBe(14);
  });

  it("τ=1 returns the treated extreme", () => {
    expect(lostDays(14, 3, 1)).toBe(3);
  });

  it("τ=0.5 returns the midpoint", () => {
    expect(lostDays(14, 3, 0.5)).toBeCloseTo(8.5, 12);
  });

  it("is linear in τ", () => {
    const d = (t: number) => lostDays(10, 2, t);
    expect(d(0.25)).toBeCloseTo(0.75 * 10 + 0.25 * 2, 12);
    expect(d(0.75)).toBeCloseTo(0.25 * 10 + 0.75 * 2, 12);
  });

  it("throws E_BAD_PRIOR for τ outside [0,1]", () => {
    expect(() => lostDays(10, 2, -0.01)).toThrow(SelectronError);
    expect(() => lostDays(10, 2, 1.01)).toThrow(SelectronError);
    try {
      lostDays(10, 2, 2);
    } catch (e) {
      expect((e as SelectronError).code).toBe("E_BAD_PRIOR");
    }
  });

  it("throws E_BAD_PRIOR for negative lost-day means", () => {
    expect(() => lostDays(-1, 2, 0.5)).toThrow(SelectronError);
    expect(() => lostDays(10, -1, 0.5)).toThrow(SelectronError);
  });
});

const VALID: PriorsJson = {
  model_version: "iter3-v1",
  fitted_at: "2026-05-18T00:00:00Z",
  conditions: {
    insomnia: {
      missions: {
        mars500: {
          log_lambda_samples: [-3.0, -2.9, -3.1],
          mean_log_lambda: -3.0,
          sd_log_lambda: 0.1,
        },
      },
      vulnerability_beta: { "psych.emotional_stability": 0.4 },
      worst_case_prob_q: 0.3,
      treated_lost_days_mean: 2.0,
      untreated_lost_days_mean: 5.0,
    },
  },
};

describe("validatePriorsJson", () => {
  it("accepts a minimal valid priors.json", () => {
    expect(() => validatePriorsJson(structuredClone(VALID))).not.toThrow();
  });

  it("rejects non-object input", () => {
    expect(() => validatePriorsJson(null)).toThrow(SelectronError);
    expect(() => validatePriorsJson([])).toThrow(SelectronError);
    expect(() => validatePriorsJson("not an object")).toThrow(SelectronError);
  });

  it("rejects missing top-level keys", () => {
    const bad = structuredClone(VALID) as Record<string, unknown>;
    delete bad.model_version;
    expect(() => validatePriorsJson(bad)).toThrow(SelectronError);
  });

  it("rejects worst_case_prob_q outside [0,1]", () => {
    const bad = structuredClone(VALID);
    bad.conditions.insomnia.worst_case_prob_q = 1.5;
    expect(() => validatePriorsJson(bad)).toThrow(SelectronError);
  });

  it("rejects negative sd_log_lambda", () => {
    const bad = structuredClone(VALID);
    bad.conditions.insomnia.missions.mars500.sd_log_lambda = -0.1;
    expect(() => validatePriorsJson(bad)).toThrow(SelectronError);
  });

  it("rejects non-finite values in log_lambda_samples", () => {
    const bad = structuredClone(VALID);
    bad.conditions.insomnia.missions.mars500.log_lambda_samples = [-3.0, NaN, -2.9];
    expect(() => validatePriorsJson(bad)).toThrow(SelectronError);
  });

  it("rejects empty log_lambda_samples — sampleFromPosterior would crash", () => {
    const bad = structuredClone(VALID);
    bad.conditions.insomnia.missions.mars500.log_lambda_samples = [];
    expect(() => validatePriorsJson(bad)).toThrow(SelectronError);
  });

  it("rejects non-finite vulnerability_beta value", () => {
    const bad = structuredClone(VALID);
    bad.conditions.insomnia.vulnerability_beta["x"] = Number.POSITIVE_INFINITY;
    expect(() => validatePriorsJson(bad)).toThrow(SelectronError);
  });

  it("rejects negative treated/untreated lost days", () => {
    const bad = structuredClone(VALID);
    bad.conditions.insomnia.treated_lost_days_mean = -1;
    expect(() => validatePriorsJson(bad)).toThrow(SelectronError);
  });

  it("error code is E_BAD_PRIOR on any failure", () => {
    try {
      validatePriorsJson(null);
    } catch (e) {
      expect((e as SelectronError).code).toBe("E_BAD_PRIOR");
    }
  });
});
