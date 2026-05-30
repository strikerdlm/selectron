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
