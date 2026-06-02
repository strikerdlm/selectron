// src/analysis/correlation.ts
// Pure Pearson / Spearman correlation utilities. Deterministic, NaN-safe.

export function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += x[i]; sy += y[i]; }
  const mx = sx / n, my = sy / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
  }
  const den = Math.sqrt(dx2 * dy2);
  return den === 0 ? 0 : num / den;
}

// Average-rank transform (1-based), so Spearman handles ties correctly.
export function rank(x: number[]): number[] {
  const order = x.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
  const ranks = new Array<number>(x.length);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[order[k][1]] = avg;
    i = j + 1;
  }
  return ranks;
}

export function spearman(x: number[], y: number[]): number {
  return pearson(rank(x), rank(y));
}

export function correlationMatrix(
  columns: number[][],
  method: "pearson" | "spearman" = "pearson",
): number[][] {
  const corr = method === "spearman" ? spearman : pearson;
  const k = columns.length;
  const m: number[][] = Array.from({ length: k }, () => new Array<number>(k).fill(0));
  for (let i = 0; i < k; i++) {
    m[i][i] = 1;
    for (let j = i + 1; j < k; j++) {
      const r = corr(columns[i], columns[j]);
      m[i][j] = r; m[j][i] = r;
    }
  }
  return m;
}

// ── Ordinary least-squares line + significance ──────────────────────────────
// These power the A3 corrgram: the lower-triangle trend lines and the
// upper-triangle r + p annotations.

export type LineFit = { slope: number; intercept: number; r: number };

/** OLS fit of y on x. Returns a zero-slope flat line through the mean when x
 *  has no variance (avoids divide-by-zero), matching `pearson`'s convention. */
export function linregress(x: number[], y: number[]): LineFit {
  const n = Math.min(x.length, y.length);
  if (n < 2) return { slope: 0, intercept: n ? y[0] : 0, r: 0 };
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += x[i]; sy += y[i]; }
  const mx = sx / n, my = sy / n;
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    sxx += dx * dx; sxy += dx * dy; syy += dy * dy;
  }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = my - slope * mx;
  const den = Math.sqrt(sxx * syy);
  const r = den === 0 ? 0 : sxy / den;
  return { slope, intercept, r };
}

// Lanczos log-gamma — accurate to ~1e-13 over the domain we need (a, b ≥ 0.5).
function logGamma(z: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let a = c[0];
  const t = z + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (z + i);
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
}

// Continued-fraction expansion for the incomplete beta (Numerical Recipes betacf).
function betacf(a: number, b: number, x: number): number {
  const MAXIT = 200, EPS = 3e-12, FPMIN = 1e-300;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Regularized incomplete beta I_x(a, b). */
export function regularizedBetaI(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  return x < (a + 1) / (a + b + 2)
    ? (bt * betacf(a, b, x)) / a
    : 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** Two-tailed p-value for a Pearson r under H0: ρ = 0, via the Student-t
 *  statistic t = r·√((n−2)/(1−r²)) with df = n−2. Exact (incomplete beta),
 *  not a normal approximation. Returns 1 when undefined (n < 3), 0 at |r| = 1. */
export function correlationPValue(r: number, n: number): number {
  if (!Number.isFinite(r) || n < 3) return 1;
  if (r <= -1 || r >= 1) return 0;
  const df = n - 2;
  const t2 = (r * r * df) / (1 - r * r);
  return regularizedBetaI(df / 2, 0.5, df / (df + t2));
}

export type CorrPair = { i: number; j: number; r: number; p: number; n: number };

/** All unordered column pairs with r and its two-tailed p-value, sorted by
 *  descending |r| so the strongest relationships lead. */
export function correlationPairs(
  columns: number[][],
  method: "pearson" | "spearman" = "pearson",
): CorrPair[] {
  const corr = method === "spearman" ? spearman : pearson;
  const k = columns.length;
  const out: CorrPair[] = [];
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      const n = Math.min(columns[i].length, columns[j].length);
      const r = corr(columns[i], columns[j]);
      out.push({ i, j, r, p: correlationPValue(r, n), n });
    }
  }
  out.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  return out;
}
