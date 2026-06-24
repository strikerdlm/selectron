import { sampleGamma } from "./gamma";
import { SelectronError } from "./errors";

function validateAlpha(alpha: readonly number[]): number {
  if (alpha.length === 0) {
    throw new SelectronError("E_BAD_WEIGHT", "alpha must contain at least one entry");
  }

  let sum = 0;
  for (let i = 0; i < alpha.length; i++) {
    const a = alpha[i];
    if (!Number.isFinite(a) || a <= 0) {
      throw new SelectronError("E_BAD_WEIGHT", `alpha[${i}] must be finite and > 0`, {
        index: i,
        value: a,
      });
    }
    sum += a;
  }

  if (!Number.isFinite(sum) || sum <= 0) {
    throw new SelectronError("E_BAD_WEIGHT", "alpha sum must be finite and > 0", { sum });
  }
  return sum;
}

export function sampleDirichlet(alpha: readonly number[], rng: () => number): Float64Array {
  validateAlpha(alpha);
  const k = alpha.length;
  const out = new Float64Array(k);
  let s = 0;
  for (let i = 0; i < k; i++) {
    out[i] = sampleGamma(alpha[i], rng);
    s += out[i];
  }
  if (!Number.isFinite(s) || s <= 0) {
    throw new SelectronError("E_SAMPLER_DIVERGED", "Dirichlet gamma draw sum must be finite and > 0", {
      sum: s,
    });
  }
  for (let i = 0; i < k; i++) out[i] /= s;
  return out;
}

export function dirichletMean(alpha: readonly number[]): number[] {
  const s = validateAlpha(alpha);
  return alpha.map((ak) => ak / s);
}

export function dirichletVariance(alpha: readonly number[]): number[] {
  const s = validateAlpha(alpha);
  return alpha.map((ak) => (ak * (s - ak)) / (s * s * (s + 1)));
}
