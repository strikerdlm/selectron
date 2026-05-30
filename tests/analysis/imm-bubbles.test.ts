// tests/analysis/imm-bubbles.test.ts
import { describe, it, expect } from "vitest";
import {
  conditionRate, worstCaseSeverity, expectedContribution,
  familyToSystemGroup, SYSTEM_GROUP_ORDER, buildBubbleData,
} from "@/analysis/imm-bubbles";
import type { IMMPrior, IMMCondition, IMMConditionFamily } from "@/imm/types";

const ALL_FAMILIES: IMMConditionFamily[] = [
  "behavioral","cardiovascular","dental","dermatologic","ENT","endocrine","GI","GU",
  "hematologic","infectious","musculoskeletal","neurologic","ophthalmologic","psychiatric",
  "renal","respiratory","space-adaptation","toxicologic","traumatic",
];

function prior(over: Partial<IMMPrior> = {}): IMMPrior {
  const pert = { min: 0, mode: 0.1, max: 0.3 };
  return {
    conditionId: "x", provenance: "tierB-pymc", source_ref: "",
    incidence: { distribution: "Gamma-Poisson", alpha: 2, beta: 200, lambda_unit: "events-per-person-day" },
    severity: { worst_case_prob_alpha: 1, worst_case_prob_beta: 3 },
    treated: { fi_cp1: pert, dt_cp1_hours: pert, fi_cp2: pert, dt_cp2_hours: pert, fi_cp3: pert, p_evac: pert, p_locl: pert },
    untreated: { fi_cp1: pert, dt_cp1_hours: pert, fi_cp2: pert, dt_cp2_hours: pert, fi_cp3: pert, p_evac: pert, p_locl: pert },
    risk_factor_multipliers: {}, required_resources: {},
    ...over,
  } as IMMPrior;
}

describe("conditionRate", () => {
  it("Gamma-Poisson λ=α/β in events/1000-PY", () => {
    // 2/200 per day = 0.01/day → ×365×1000 = 3650
    expect(conditionRate(prior())).toBeCloseTo(3650, 6);
  });
  it("Fixed uses lambda_fixed", () => {
    expect(conditionRate(prior({ incidence: { distribution: "Fixed", lambda_fixed: 0.001 } } as Partial<IMMPrior>)))
      .toBeCloseTo(365, 6);
  });
  it("returns null for Beta-Bernoulli (per-event, not per-time)", () => {
    expect(conditionRate(prior({ incidence: { distribution: "Beta-Bernoulli", alpha: 2, beta: 18 } } as Partial<IMMPrior>)))
      .toBeNull();
  });
});

describe("worstCaseSeverity", () => {
  it("is α/(α+β)", () => {
    expect(worstCaseSeverity(prior())).toBeCloseTo(0.25, 12); // 1/(1+3)
  });
});

describe("expectedContribution", () => {
  it("scales with mission length", () => {
    const short = expectedContribution(prior(), 30);
    const long = expectedContribution(prior(), 180);
    expect(long).toBeGreaterThan(short);
  });
  it("is 0 for non-rate priors", () => {
    expect(expectedContribution(prior({ incidence: { distribution: "Beta-Bernoulli", alpha: 2, beta: 18 } } as Partial<IMMPrior>), 180)).toBe(0);
  });
});

describe("familyToSystemGroup", () => {
  it("maps every IMM family to a defined group", () => {
    for (const f of ALL_FAMILIES) {
      expect(SYSTEM_GROUP_ORDER).toContain(familyToSystemGroup(f));
    }
  });
});

describe("buildBubbleData", () => {
  it("includes rate-based conditions and excludes Beta-Bernoulli ones", () => {
    const conditions = [
      { id: "a", label: "A", family: "GI", incidenceSource: "in-flight", incidenceDist: "Gamma", processType: "general-Poisson", riskFactors: [], vulnerabilityCriteria: [] },
      { id: "b", label: "B", family: "infectious", incidenceSource: "in-flight", incidenceDist: "Beta", processType: "general-Poisson", riskFactors: [], vulnerabilityCriteria: [] },
    ] as unknown as IMMCondition[];
    const priors = { a: prior(), b: prior({ incidence: { distribution: "Beta-Bernoulli", alpha: 2, beta: 18 } } as Partial<IMMPrior>) };
    const { points, excluded } = buildBubbleData(conditions, priors, 180);
    expect(points).toHaveLength(1);
    expect(points[0].id).toBe("a");
    expect(points[0].rate).toBeGreaterThan(0);
    expect(excluded).toEqual(["b"]);
  });
});
