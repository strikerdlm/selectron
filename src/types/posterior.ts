export type ScoreDistribution = {
  samples: Float64Array;
  /** IID score draws induced by the explicit criterion-weight prior. */
  ess: number;
  mean: number;
  /** Central 90% score interval, not a confidence interval or suitability posterior. */
  ci90: readonly [number, number];
  /** Central 95% score interval, not a confidence interval or suitability posterior. */
  ci95: readonly [number, number];
};

/** @deprecated Use ScoreDistribution for Stage-A MCDA outputs. */
export type Posterior = ScoreDistribution;
