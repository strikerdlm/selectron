// src/imm/incidence.ts — Poisson, Gamma-Poisson, Lognormal-Poisson, Beta-Bernoulli samplers
// Rng inlined (matches src/risk/incidence.ts convention; prng.ts does not export this type)
type Rng = () => number;

const LANCZOS_G = 7;
const LANCZOS_COEFS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

function logGamma(z: number): number {
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = LANCZOS_COEFS[0];
  for (let i = 1; i < LANCZOS_G + 2; i++) x += LANCZOS_COEFS[i] / (z + i);
  const t = z + LANCZOS_G + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

export function samplePoisson(rng: Rng, lambda: number): number {
  if (lambda <= 0) return 0;
  if (lambda < 30) {
    // Knuth multiplicative method
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    while (p > L) { k++; p *= rng(); }
    return k - 1;
  }
  // Hörmann PTRS for large lambda
  const slam = Math.sqrt(lambda);
  const loglam = Math.log(lambda);
  const b = 0.931 + 2.53 * slam;
  const a = -0.059 + 0.02483 * b;
  const invalpha = 1.1239 + 1.1328 / (b - 3.4);
  const vr = 0.9277 - 3.6224 / (b - 2);
  for (;;) {
    const U = rng() - 0.5;
    const V = rng();
    const us = 0.5 - Math.abs(U);
    const k = Math.floor((2 * a / us + b) * U + lambda + 0.43);
    if (us >= 0.07 && V <= vr) return k;
    if (k < 0 || (us < 0.013 && V > us)) continue;
    if (Math.log(V) + Math.log(invalpha) - Math.log(a / (us * us) + b) <=
        -lambda + k * loglam - logGamma(k + 1)) return k;
  }
}

// ── Task 17 additions ─────────────────────────────────────────────────────────
import { sampleGamma } from "../engine/gamma";  // reuse existing Marsaglia-Tsang
// NOTE: sampleGamma signature is (shape: number, rng: () => number) — shape first.

export function sampleLognormal(rng: Rng, mu: number, sigma: number): number {
  // Box-Muller standard normal → exp(mu + sigma * z)
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.exp(mu + sigma * z);
}

export function sampleLognormalPoisson(rng: Rng, mu: number, sigma: number): number {
  const lambda = sampleLognormal(rng, mu, sigma);
  return samplePoisson(rng, lambda);
}

export function sampleGammaPoisson(rng: Rng, alpha: number, beta: number): number {
  // Gamma(alpha, beta) prior → Poisson(lambda); marginally Negative-Binomial.
  // sampleGamma takes (shape, rng) — shape first per src/engine/gamma.ts convention.
  const lambda = sampleGamma(alpha, rng) / beta;
  return samplePoisson(rng, lambda);
}

export function sampleBeta(rng: Rng, alpha: number, beta: number): number {
  const x = sampleGamma(alpha, rng);
  const y = sampleGamma(beta, rng);
  return x / (x + y);
}

export function sampleBetaBernoulli(rng: Rng, alpha: number, beta: number): 0 | 1 {
  const p = sampleBeta(rng, alpha, beta);
  return rng() < p ? 1 : 0;
}

/**
 * samplePoissonProcess — homogeneous Poisson process via inter-arrival times.
 * Returns sorted list of event times in [0, duration].
 * Uses -log(U)/lambda inter-arrival gaps; U floored at 1e-12 to avoid log(0).
 */
export function samplePoissonProcess(rng: Rng, lambda: number, duration: number): number[] {
  if (lambda <= 0 || duration <= 0) return [];
  const times: number[] = [];
  let t = 0;
  while (true) {
    const u = Math.max(rng(), 1e-12);
    t += -Math.log(u) / lambda;
    if (t >= duration) break;
    times.push(t);
  }
  return times;
}
