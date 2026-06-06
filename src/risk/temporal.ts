type Rng = () => number;

/** Latent class: 0 = stable (flat), 1 = unstable (back-loaded rising). */
export type LatentClass = 0 | 1;

/** M_c(u) = ∫₀ᵘ g_c. stable = u; unstable = u + a·u^(p+1)/(p+1). */
function cumulativeShape(u: number, cls: LatentClass, a: number, p: number): number {
  return cls === 0 ? u : u + (a * Math.pow(u, p + 1)) / (p + 1);
}

/** ∫₀¹ g_c du — the duration-independent average intensity factor. */
export function integratedIntensity(cls: LatentClass, a: number, p: number): number {
  return cumulativeShape(1, cls, a, p);
}

/**
 * Mission-fraction of the first event for an NHPP whose total expected count is
 * `totalMean`. Draws E~Exp(1); solves Λ(u*)=E where Λ(u)=totalMean·M_c(u)/M_c(1).
 * Returns 1.0 (right-censored) when no event occurs within the mission.
 */
export function firstEventFraction(
  rng: Rng,
  totalMean: number,
  cls: LatentClass,
  a: number,
  p: number,
): number {
  if (!(totalMean > 0)) return 1;
  const E = -Math.log(Math.max(rng(), 1e-12)); // Exp(1)
  const M1 = cumulativeShape(1, cls, a, p);
  const target = (E / totalMean) * M1; // want M_c(u*) = target
  if (target >= M1) return 1; // beyond mission end → censored
  // bisection on u ∈ [0,1] for M_c(u) = target (M_c monotone increasing)
  let lo = 0, hi = 1;
  for (let it = 0; it < 60; it++) {
    const mid = (lo + hi) / 2;
    if (cumulativeShape(mid, cls, a, p) < target) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
