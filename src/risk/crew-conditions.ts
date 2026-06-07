/**
 * crew-conditions.ts
 *
 * Pure-math factors for the crew-level team-condition hazard:
 *   - dyadFactor        — dyadic exposure scaling relative to a reference crew size
 *   - heterogeneityFactor — trait spread across the crew raises tension (Kanas 1998)
 *   - weakestLinkFactor   — most conflict-prone member dominates risk (Basner 2014)
 *   - attributeEvents     — weighted-multinomial event attribution reproducing the
 *                           conflict-concentration finding (Basner 2014)
 *
 * Precondition: refN ≥ 2 (the schema enforces dyad_ref_n ≥ 2; refN=1 would
 * produce D(refN)=0 and a divide-by-zero).
 *
 * Population SD (÷N) is intentional — we characterise the dispersion of the
 * current crew, not an estimate of a larger population.
 */

type Rng = () => number;

/** D(n) = n*(n-1)/2 — number of dyads for crew of size n. */
function dyads(n: number): number {
  return (n * (n - 1)) / 2;
}

/**
 * Crew-size dyadic exposure factor relative to a reference crew size.
 * D(n)/D(refN). n < 2 → 0 (no dyads possible).
 * Precondition: refN ≥ 2.
 */
export function dyadFactor(n: number, refN: number): number {
  if (n < 2) return 0;
  return dyads(n) / dyads(refN);
}

/** Population standard deviation (÷N). Returns 0 for empty arrays. */
function sd(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const v = xs.reduce((a, b) => a + (b - mean) * (b - mean), 0) / xs.length;
  return Math.sqrt(v);
}

/**
 * exp(betaHet · SD(proneness)).
 * Trait spread across the crew raises conflict tension (Kanas 1998).
 * All-identical crew → SD=0 → factor=1 (no amplification).
 */
export function heterogeneityFactor(proneness: readonly number[], betaHet: number): number {
  return Math.exp(betaHet * sd(proneness));
}

/**
 * exp(betaWeak · max(proneness)).
 * The most conflict-prone member dominates risk (Basner 2014).
 * Empty crew → factor=1.
 */
export function weakestLinkFactor(proneness: readonly number[], betaWeak: number): number {
  const worst = proneness.length ? Math.max(...proneness) : 0;
  return Math.exp(betaWeak * worst);
}

/**
 * Distribute n crew-level events to members by a weighted multinomial with
 * weights ∝ (proneness shifted to be strictly positive). Reproduces conflict
 * concentration (Basner 2014: a minority of crew carries most conflicts).
 *
 * Returns an array of integer counts of length weights.length summing to n.
 * n ≤ 0 → all zeros.
 */
export function attributeEvents(rng: Rng, n: number, weights: readonly number[]): number[] {
  const counts = new Array<number>(weights.length).fill(0);
  if (n <= 0 || weights.length === 0) return counts;
  const minW = Math.min(...weights);
  const shift = minW < 0.01 ? 0.01 - minW : 0; // keep strictly positive
  const w = weights.map((x) => x + shift);
  const total = w.reduce((a, b) => a + b, 0);
  for (let e = 0; e < n; e++) {
    let r = rng() * total;
    let k = 0;
    while (k < w.length - 1 && r >= w[k]) {
      r -= w[k];
      k++;
    }
    counts[k]++;
  }
  return counts;
}
