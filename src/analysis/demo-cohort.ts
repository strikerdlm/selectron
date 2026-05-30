// src/analysis/demo-cohort.ts
// Seeded synthetic candidate cohort with a known latent-factor covariance, so the
// Analysis correlation figures display real (non-noise) structure on the journal site.
import type { Candidate, Criterion } from "@/types";

export const DEMO_SEED = 0xc0ffee;
export const DEMO_N = 40;

// Numerical Recipes LCG (same constants as TestFigureHost), mapped to [0,1).
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0x100000000; };
}
// Standard normal via Box-Muller.
function gauss(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-12), u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

type Loading = { psych: number; cog: number; fit: number; noise: number };
const LOADINGS: Record<string, Loading> = {
  "psych.conscientiousness":          { psych: 0.80, cog: 0.20, fit: 0.0, noise: 0.5 },
  "psych.emotional_stability":        { psych: 0.85, cog: 0.0, fit: 0.10, noise: 0.5 },
  "psych.resilience_cdrisc":          { psych: 0.80, cog: 0.0, fit: 0.20, noise: 0.5 },
  "psych.emotional_intelligence":     { psych: 0.70, cog: 0.30, fit: 0.0, noise: 0.5 },
  "psych.mmpi2rf_eid":                { psych: -0.75, cog: 0.0, fit: 0.0, noise: 0.5 },
  "psych.bdi2_baseline":              { psych: -0.70, cog: 0.0, fit: 0.0, noise: 0.5 },
  "behavioral.teamwork":              { psych: 0.60, cog: 0.20, fit: 0.0, noise: 0.6 },
  "cognitive.nasa_cognition_battery": { psych: 0.10, cog: 0.85, fit: 0.0, noise: 0.5 },
  "cognitive.pvt_b_rt_ms":            { psych: 0.0, cog: -0.80, fit: 0.0, noise: 0.5 },
  "physical.vo2max":                  { psych: 0.0, cog: 0.0, fit: 0.90, noise: 0.4 },
  "physical.sot5_equilibrium":        { psych: 0.0, cog: 0.10, fit: 0.70, noise: 0.5 },
  "professional.technical_competence":{ psych: 0.20, cog: 0.60, fit: 0.0, noise: 0.6 },
};

export function makeDemoCohort(
  criteria: readonly Criterion[],
  n = DEMO_N,
  seed = DEMO_SEED,
): Candidate[] {
  const rng = lcg(seed);
  const out: Candidate[] = [];
  for (let i = 0; i < n; i++) {
    const fPsych = gauss(rng), fCog = gauss(rng), fFit = gauss(rng);
    const scores: Record<string, number> = {};
    for (const c of criteria) {
      const L = LOADINGS[c.id] ?? { psych: 0, cog: 0, fit: 0, noise: 1 };
      const z = L.psych * fPsych + L.cog * fCog + L.fit * fFit + L.noise * gauss(rng);
      const mid = (c.scale.min + c.scale.max) / 2;
      const span = c.scale.max - c.scale.min;
      const raw = mid + z * (span / 6);
      scores[c.id] = Math.min(c.scale.max, Math.max(c.scale.min, raw));
    }
    const tag = String(i + 1).padStart(2, "0");
    out.push({ id: `demo-${tag}`, alias: `DEMO-${tag}`, scores });
  }
  return out;
}
