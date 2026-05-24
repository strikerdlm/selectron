// Kolmogorov-Smirnov statistic and regularized incomplete Beta CDF.
// betaCDF uses the Lentz continued-fraction method from Numerical Recipes §6.4,
// with explicit even/odd step unrolling (standard NR betacf form).
// logGamma uses Lanczos g=7 coefficients (same set as src/imm/incidence.ts).

function logGamma(z: number): number {
  const g = 7;
  const coefs = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = coefs[0];
  for (let i = 1; i < g + 2; i++) x += coefs[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

/**
 * Lentz continued-fraction evaluation for the regularized incomplete Beta.
 * Follows Numerical Recipes §6.4 (betacf) with explicit even/odd pair steps
 * to avoid the trivial-convergence trap in single-step Lentz initializations.
 */
function betaCFrac(x: number, a: number, b: number): number {
  const MAXIT = 200;
  const EPS = 3e-14;
  const FPMIN = 1e-30;

  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;

  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    // Even step
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    // Odd step
    aa = -((a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/**
 * Regularized incomplete Beta function I_x(a, b) — the CDF of Beta(a, b) at x.
 * Uses the symmetry relation I_x(a,b) = 1 - I_{1-x}(b,a) for x > (a+1)/(a+b+2)
 * to keep the continued fraction in its convergence domain.
 */
export function betaCDF(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const logBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const bt = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - logBeta);
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaCFrac(x, a, b)) / a;
  }
  return 1 - (bt * betaCFrac(1 - x, b, a)) / b;
}

/**
 * Two-sided Kolmogorov-Smirnov statistic D_n = sup_x |F_n(x) - F(x)|.
 * @param sortedSamples  Pre-sorted array of observations (ascending).
 * @param cdf            Theoretical CDF to compare against.
 */
export function ksStatistic(sortedSamples: number[], cdf: (x: number) => number): number {
  const n = sortedSamples.length;
  let D = 0;
  for (let i = 0; i < n; i++) {
    const Fn = (i + 1) / n;
    const FnPrev = i / n;
    const Fx = cdf(sortedSamples[i]);
    D = Math.max(D, Math.abs(Fn - Fx), Math.abs(FnPrev - Fx));
  }
  return D;
}
