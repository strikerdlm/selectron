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

function quantile(sortedAsc: Float64Array, q: number): number {
  const n = sortedAsc.length;
  const idx = q * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  const frac = idx - lo;
  return sortedAsc[lo] * (1 - frac) + sortedAsc[hi] * frac;
}

function validateAlphaForCriteria(alpha: readonly number[], criteria: readonly Criterion[]): void {
  if (alpha.length !== criteria.length) {
    throw new SelectronError("E_BAD_WEIGHT", "alpha length must equal criteria length", {
      alpha: alpha.length,
      criteria: criteria.length,
    });
  }
  for (let i = 0; i < alpha.length; i++) {
    const a = alpha[i];
    if (!Number.isFinite(a) || a <= 0) {
      throw new SelectronError("E_BAD_WEIGHT", `alpha[${i}] must be finite and > 0`, {
        index: i,
        value: a,
      });
    }
  }
}

export function scoreCandidate(input: ScoreInput): Posterior {
  const { candidate, criteria, alpha, iterations, seed } = input;
  if (!Number.isInteger(iterations) || iterations <= 0) {
    throw new SelectronError("E_BAD_ITERATIONS", `iterations must be a positive integer, got ${iterations}`, {
      iterations,
    });
  }
  validateAlphaForCriteria(alpha, criteria);

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
    ess: samples.length,
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
  validateAlphaForCriteria(alpha, criteria);
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
