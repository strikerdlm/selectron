export type Posterior = {
  samples: Float64Array;
  ess: number;
  mean: number;
  ci90: readonly [number, number];
  ci95: readonly [number, number];
};
