// src/analysis/descriptive.ts
// Pure descriptive statistics for the A1 cohort-distribution figure.
// Deterministic, NaN-safe. Sample (n−1) conventions, type-7 quantiles
// (the numpy/Excel default), adjusted Fisher-Pearson skewness (Excel SKEW).

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

/** Sample standard deviation (divides by n−1). Returns 0 for n < 2. */
export function sampleStdDev(xs: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const m = mean(xs);
  let s2 = 0;
  for (const x of xs) s2 += (x - m) * (x - m);
  return Math.sqrt(s2 / (n - 1));
}

/** Linear-interpolation (type-7) quantile of an already-sorted array. */
export function quantileSorted(sorted: number[], q: number): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  if (n === 1) return sorted[0];
  const h = (n - 1) * Math.min(1, Math.max(0, q));
  const lo = Math.floor(h);
  const frac = h - lo;
  const next = lo + 1 < n ? sorted[lo + 1] : sorted[lo];
  return sorted[lo] + frac * (next - sorted[lo]);
}

export type FiveNumber = { min: number; q1: number; median: number; q3: number; max: number };

export function fiveNumberSummary(xs: number[]): FiveNumber {
  const s = [...xs].sort((a, b) => a - b);
  return {
    min: s[0] ?? NaN,
    q1: quantileSorted(s, 0.25),
    median: quantileSorted(s, 0.5),
    q3: quantileSorted(s, 0.75),
    max: s[s.length - 1] ?? NaN,
  };
}

/** Adjusted Fisher-Pearson standardized moment (Excel SKEW). 0 for n < 3 or
 *  zero variance. Positive ⇒ right tail. */
export function skewness(xs: number[]): number {
  const n = xs.length;
  if (n < 3) return 0;
  const m = mean(xs);
  const sd = sampleStdDev(xs);
  if (sd === 0) return 0;
  let s3 = 0;
  for (const x of xs) {
    const z = (x - m) / sd;
    s3 += z * z * z;
  }
  return (n / ((n - 1) * (n - 2))) * s3;
}
