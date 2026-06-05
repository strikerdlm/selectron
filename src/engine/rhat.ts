export function computeRhat(chains: number[][]): number {
  const m = chains.length;
  if (m < 2) throw new Error("R̂ requires at least 2 chains");
  const n = chains[0].length;
  if (n < 2) throw new Error("R̂ requires at least 2 samples per chain");
  for (const ch of chains) {
    if (ch.length !== n) throw new Error("All chains must have equal length");
  }

  const chainMeans = chains.map((ch) => {
    let s = 0;
    for (const x of ch) s += x;
    return s / n;
  });

  let grandMean = 0;
  for (const mu of chainMeans) grandMean += mu;
  grandMean /= m;

  let B = 0;
  for (const mu of chainMeans) B += (mu - grandMean) ** 2;
  B *= n / (m - 1);

  // B === 0 means all chains have identical means → perfect between-chain agreement → converged
  if (B === 0) return 1.0;

  let W = 0;
  for (let j = 0; j < m; j++) {
    let s2 = 0;
    for (const x of chains[j]) s2 += (x - chainMeans[j]) ** 2;
    s2 /= n - 1;
    W += s2;
  }
  W /= m;

  if (W === 0) return 1.0;
  return Math.sqrt(((n - 1) / n) + B / (n * W));
}
