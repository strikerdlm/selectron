// Marsaglia–Tsang Gamma(shape, 1) sampler.
// For shape < 1, use the boosting trick: G(a) = G(a+1) * U^(1/a).
// Reference: Marsaglia & Tsang (2000), "A Simple Method for Generating Gamma Variables".

function sampleStandardNormal(rng: () => number): number {
  // Box–Muller; we only need one of the pair.
  const u1 = Math.max(rng(), Number.EPSILON);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function sampleGamma(shape: number, rng: () => number): number {
  if (shape <= 0) throw new RangeError(`shape must be > 0, got ${shape}`);
  if (shape < 1) {
    // Stuart boosting.
    const g = sampleGamma(shape + 1, rng);
    return g * Math.pow(Math.max(rng(), Number.EPSILON), 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  // Acceptance-rejection on a normal proposal.
  for (;;) {
    const x = sampleStandardNormal(rng);
    const v0 = 1 + c * x;
    if (v0 <= 0) continue;
    const v = v0 * v0 * v0;
    const u = rng();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}
