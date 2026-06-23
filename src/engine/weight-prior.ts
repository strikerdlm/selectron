export type WeightPriorConfig = {
  meanWeights: readonly number[];
  kappa: number;
  alpha: readonly number[];
  source: "equal-weight-demo" | "expert-elicited";
  evidenceStatus: "demo" | "elicited";
};

export function buildEqualWeightPrior(k: number, kappa = k): WeightPriorConfig {
  if (!Number.isInteger(k) || k <= 0) {
    throw new Error(`E_BAD_WEIGHT_PRIOR: k must be a positive integer (got ${k})`);
  }
  if (!Number.isFinite(kappa) || kappa <= 0) {
    throw new Error(`E_BAD_WEIGHT_PRIOR: kappa must be > 0 (got ${kappa})`);
  }

  const meanWeights = Array.from({ length: k }, () => 1 / k);
  const alpha = meanWeights.map((m) => kappa * m);
  return {
    meanWeights,
    kappa,
    alpha,
    source: "equal-weight-demo",
    evidenceStatus: "demo",
  };
}
