import { describe, it, expect } from "vitest";
import { validatePriorsJson, type PriorsJson } from "@/risk/priorsSchema";

const base = (): PriorsJson => ({
  model_version: "t", fitted_at: "t",
  conditions: {
    a: { missions: { antarctic: { log_lambda_samples: [-7], mean_log_lambda: -7, sd_log_lambda: 0.1 } },
      vulnerability_beta: {}, worst_case_prob_q: 0.25, treated_lost_days_mean: 1, untreated_lost_days_mean: 4 },
  },
});

const team = () => ({
  crew_frailty_phi_samples: [2, 3], member_frailty_phi: 4,
  pi_unstable_base: 0.658, alpha_fit: -0.5, sigma_log_beta: 0.3,
  temporal_a: 2, temporal_p: 2, beta_het: 0.3, beta_weak: 0.4, dyad_ref_n: 6,
  lambda_base_samples: { "conflict-event": [0.01, 0.012] },
});

describe("validatePriorsJson team block", () => {
  it("accepts a valid optional team block", () => {
    expect(() => validatePriorsJson({ ...base(), team: team() })).not.toThrow();
  });
  it("accepts priors with NO team block (backward compatible)", () => {
    expect(() => validatePriorsJson(base())).not.toThrow();
  });
  it("rejects pi_unstable_base outside [0,1]", () => {
    expect(() => validatePriorsJson({ ...base(), team: { ...team(), pi_unstable_base: 1.5 } })).toThrow();
  });
  it("rejects empty crew_frailty_phi_samples", () => {
    expect(() => validatePriorsJson({ ...base(), team: { ...team(), crew_frailty_phi_samples: [] } })).toThrow();
  });
  it("rejects non-positive member_frailty_phi", () => {
    expect(() => validatePriorsJson({ ...base(), team: { ...team(), member_frailty_phi: 0 } })).toThrow();
  });
});
