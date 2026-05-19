import { SelectronError } from "@/engine/errors";

type Rng = () => number;

// Lanczos log-Gamma. Coefficients from Numerical Recipes 3e §6.1.
// Accurate to ~14 decimal digits for x > 0. Used by the PTRS Poisson sampler.
function logGamma(x: number): number {
  const c = [
    57.1562356658629235, -59.5979603554754912, 14.1360979747417471,
    -0.491913816097620199, 0.339946499848118887e-4, 0.465236289270485756e-4,
    -0.983744753048795646e-4, 0.158088703224912494e-3, -0.210264441724104883e-3,
    0.217439618382473817e-3, -0.164318106536763890e-3, 0.844182239838527433e-4,
    -0.261908384015814087e-4, 0.368991826595316234e-5,
  ];
  let y = x;
  const t = x + 671 / 128;
  let ser = 0.999999999999997092;
  for (const ci of c) ser += ci / ++y;
  return Math.log(2.5066282746310005 * ser / x) + (x + 0.5) * Math.log(t) - t;
}

/**
 * Poisson sampler.
 *   λ < 30 → Knuth multiplicative inversion. O(λ) expected, simple, exact.
 *   λ ≥ 30 → Hörmann 1993 transformed rejection (PTRS). O(1) expected.
 *
 * Reference: Hörmann (1993) "The transformed rejection method for generating
 * Poisson random variables", Insurance: Mathematics & Economics 12, 39–45.
 */
export function samplePoisson(rng: Rng, lambda: number): number {
  if (!Number.isFinite(lambda) || lambda < 0) {
    throw new SelectronError(
      "E_BAD_PRIOR",
      `Poisson rate λ must be a finite non-negative number, got ${lambda}`,
      { lambda },
    );
  }
  if (lambda === 0) return 0;
  if (lambda < 30) return knuthPoisson(rng, lambda);
  return ptrsPoisson(rng, lambda);
}

function knuthPoisson(rng: Rng, lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1.0;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}

function ptrsPoisson(rng: Rng, lambda: number): number {
  const slambda = Math.sqrt(lambda);
  const b = 0.931 + 2.53 * slambda;
  const a = -0.059 + 0.02483 * b;
  const invAlpha = 1.1239 + 1.1328 / (b - 3.4);
  const vR = 0.9277 - 3.6224 / (b - 2);
  const lnLambda = Math.log(lambda);

  for (;;) {
    const u = rng() - 0.5;
    const v = rng();
    const us = 0.5 - Math.abs(u);
    const k = Math.floor((2 * a / us + b) * u + lambda + 0.43);
    if (us >= 0.07 && v <= vR) return k;
    if (k < 0 || (us < 0.013 && v > us)) continue;
    const lhs = Math.log(v) + Math.log(invAlpha) - Math.log(a / (us * us) + b);
    const rhs = -lambda + k * lnLambda - logGamma(k + 1);
    if (lhs <= rhs) return k;
  }
}

/**
 * Binomial(n, p) sampler.
 *
 * Implementation: direct Bernoulli loop, O(n). For Selectron Iter-3 the event
 * trigger count n_e (EVAs per mission) is ≤ ~15, so O(n) is fine. If a future
 * use case needs n > ~1000, swap in BTPE (Kachitvichyanukul & Schmeiser 1988).
 */
export function sampleBinomial(rng: Rng, n: number, p: number): number {
  if (!Number.isInteger(n) || n < 0) {
    throw new SelectronError(
      "E_BAD_PRIOR",
      `Binomial trial count n must be a non-negative integer, got ${n}`,
      { n },
    );
  }
  if (!Number.isFinite(p) || p < 0 || p > 1) {
    throw new SelectronError(
      "E_BAD_PRIOR",
      `Binomial probability p must be in [0,1], got ${p}`,
      { p },
    );
  }
  if (n === 0 || p === 0) return 0;
  if (p === 1) return n;
  let k = 0;
  for (let i = 0; i < n; i++) if (rng() < p) k++;
  return k;
}

/**
 * Candidate-vulnerability log-linear multiplier on a per-person-day incidence
 * rate λ: λ_i = λ_base · exp(Σ_j β_j · z_{i,j}).
 *
 * β is the per-criterion vulnerability coefficient (Iter-3 spec §3.1); z is
 * the normalised Stage-A score vector for crew member i. Only keys present in
 * BOTH β and z contribute; missing keys are treated as 0 (no contribution).
 *
 * Preserves Poisson conjugacy — this is the standard PRA scaling convention
 * (Cox 1972 proportional hazards; Apostolakis 2004 Bayesian PRA).
 */
export function applyVulnerabilityMultiplier(
  baseLambda: number,
  beta: Record<string, number>,
  z: Record<string, number>,
): number {
  if (!Number.isFinite(baseLambda) || baseLambda < 0) {
    throw new SelectronError(
      "E_BAD_PRIOR",
      `baseLambda must be a finite non-negative number, got ${baseLambda}`,
      { baseLambda },
    );
  }
  let dot = 0;
  for (const key of Object.keys(beta)) {
    const zi = z[key];
    if (zi !== undefined && Number.isFinite(zi)) dot += beta[key] * zi;
  }
  return baseLambda * Math.exp(dot);
}
