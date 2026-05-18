import { sampleGamma } from "./gamma";

export function sampleDirichlet(alpha: readonly number[], rng: () => number): Float64Array {
  const k = alpha.length;
  const out = new Float64Array(k);
  let s = 0;
  for (let i = 0; i < k; i++) {
    out[i] = sampleGamma(alpha[i], rng);
    s += out[i];
  }
  for (let i = 0; i < k; i++) out[i] /= s;
  return out;
}

export function dirichletMean(alpha: readonly number[]): number[] {
  const s = alpha.reduce((a, b) => a + b, 0);
  return alpha.map((ak) => ak / s);
}

export function dirichletVariance(alpha: readonly number[]): number[] {
  const s = alpha.reduce((a, b) => a + b, 0);
  return alpha.map((ak) => (ak * (s - ak)) / (s * s * (s + 1)));
}
