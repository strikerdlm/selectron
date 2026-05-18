import type { Candidate, Criterion, Posterior } from "@/types";
import { sampleDirichlet, dirichletMean, dirichletVariance } from "./dirichlet";
import { normalizeScore } from "./normalize";
import { makeRng } from "./prng";
import { SelectronError } from "./errors";

export type ScoreInput = {
  candidate: Candidate;
  criteria: readonly Criterion[];
  alpha: readonly number[];
  iterations: number;
  seed: number;
};

function normalizedScoreVector(candidate: Candidate, criteria: readonly Criterion[]): Float64Array {
  if (criteria.length === 0) throw new SelectronError("E_NO_CRITERIA", "criteria array is empty");
  const z = new Float64Array(criteria.length);
  for (let k = 0; k < criteria.length; k++) {
    const c = criteria[k];
    const raw = candidate.scores[c.id];
    if (raw === undefined) {
      throw new SelectronError("E_BAD_SCORE", `candidate missing score for ${c.id}`, {
        criterion: c.id,
        candidate: candidate.id,
      });
    }
    z[k] = normalizeScore(raw, c.scale, c.higherIsBetter);
  }
  return z;
}

function autocorrelation1(samples: Float64Array, mean: number): number {
  const n = samples.length;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n - 1; i++) {
    num += (samples[i] - mean) * (samples[i + 1] - mean);
  }
  for (let i = 0; i < n; i++) {
    den += (samples[i] - mean) ** 2;
  }
  return den > 0 ? num / den : 0;
}

function effectiveSampleSize(samples: Float64Array, mean: number): number {
  const rho1 = autocorrelation1(samples, mean);
  // ESS ≈ N * (1 - rho1) / (1 + rho1); independent samples → rho1 ≈ 0 → ESS ≈ N
  const ratio = Math.max(0, (1 - rho1) / (1 + rho1));
  return samples.length * ratio;
}

function quantile(sortedAsc: Float64Array, q: number): number {
  const n = sortedAsc.length;
  const idx = q * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  const frac = idx - lo;
  return sortedAsc[lo] * (1 - frac) + sortedAsc[hi] * frac;
}

export function scoreCandidate(input: ScoreInput): Posterior {
  const { candidate, criteria, alpha, iterations, seed } = input;
  if (alpha.length !== criteria.length) {
    throw new SelectronError("E_BAD_WEIGHT", "alpha length must equal criteria length", {
      alpha: alpha.length,
      criteria: criteria.length,
    });
  }
  for (const a of alpha) {
    if (a <= 0) throw new SelectronError("E_BAD_WEIGHT", "all alpha entries must be > 0");
  }

  const z = normalizedScoreVector(candidate, criteria);
  const rng = makeRng(seed);
  const samples = new Float64Array(iterations);
  for (let t = 0; t < iterations; t++) {
    const w = sampleDirichlet(alpha, rng);
    let s = 0;
    for (let k = 0; k < z.length; k++) s += w[k] * z[k];
    samples[t] = s;
  }

  let mean = 0;
  for (let t = 0; t < iterations; t++) mean += samples[t];
  mean /= iterations;

  const sorted = new Float64Array(samples).sort();
  return {
    samples,
    ess: effectiveSampleSize(samples, mean),
    mean,
    ci90: [quantile(sorted, 0.05), quantile(sorted, 0.95)] as const,
    ci95: [quantile(sorted, 0.025), quantile(sorted, 0.975)] as const,
  };
}

export type ClosedFormInput = {
  candidate: Candidate;
  criteria: readonly Criterion[];
  alpha: readonly number[];
};

export function closedFormMoments(input: ClosedFormInput): { mean: number; variance: number } {
  const { candidate, criteria, alpha } = input;
  const z = normalizedScoreVector(candidate, criteria);
  const muW = dirichletMean(alpha);
  const varW = dirichletVariance(alpha);

  // E[S] = sum_k mu_k * z_k
  let mean = 0;
  for (let k = 0; k < z.length; k++) mean += muW[k] * z[k];

  // Cov(w_k, w_l) = -alpha_k * alpha_l / (alpha0^2 * (alpha0 + 1)), k != l
  // Var(S) = sum_k z_k^2 * Var(w_k) + sum_{k!=l} z_k * z_l * Cov(w_k, w_l)
  const alpha0 = alpha.reduce((a, b) => a + b, 0);
  let variance = 0;
  for (let k = 0; k < z.length; k++) {
    variance += z[k] * z[k] * varW[k];
    for (let l = 0; l < z.length; l++) {
      if (k === l) continue;
      const cov = (-alpha[k] * alpha[l]) / (alpha0 * alpha0 * (alpha0 + 1));
      variance += z[k] * z[l] * cov;
    }
  }
  return { mean, variance };
}
