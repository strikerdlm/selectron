// Iter-3 SCAFFOLD — synthetic placeholder priors + crew helper for the
// Mission-risk UI tab. Replace SYNTHETIC_PRIORS with the real priors.json
// emitted by the Phase 3A/3B PyMC fit before claiming Iter-3 production
// readiness. Replace synthesizeCrew with the Iter-2 multi-candidate list
// when that lands.
//
// Shape mirrors tests/risk/simulate.test.ts::syntheticPriors so the App.tsx
// wired simulator behaves identically to the unit tests.

import type { Candidate } from "@/types";
import type { PriorsJson } from "@/risk/priorsSchema";
import { ANALOG_CONDITIONS } from "@/risk/conditions";
import { ANALOG_MISSIONS } from "@/data/analog-missions";
import { makeRng } from "@/engine/prng";

const PRIORS_SEED = 0xfeed;
const SAMPLES_PER_MISSION = 1000;

// The original five mission types, in their original order. Their priors are
// built FIRST, with the exact original salt sequence, so every existing mission
// (and every test that pins their behaviour — e.g. the M18 σ-convergence gate
// on mdrs-2wk) stays byte-identical.
const LEGACY_MISSION_TYPES = ["antarctic", "mars500", "hi-seas", "mdrs", "emmpol"] as const;

// Any mission type present in the catalog but NOT in the legacy list. When the
// catalog was expanded, "thor" (short-22d) was added but never given priors —
// so that mission found no prior for any condition → zero events → CHI = 100 %
// (a spurious "perfect, GO" verdict). These extra types are covered in a second
// ADDITIVE pass below, fixing the silent zero-risk bug without perturbing the
// legacy missions' λ. Deriving from the catalog means it can never drift again.
const EXTRA_MISSION_TYPES = Array.from(new Set(ANALOG_MISSIONS.map((m) => m.type))).filter(
  (t) => !(LEGACY_MISSION_TYPES as readonly string[]).includes(t),
);

const SD_LOG = 0.3;
const meanLogFor = (kind: string): number => (kind === "event" ? Math.log(0.05) : Math.log(0.0005));

function makeLogLambdaSamples(meanLog: number, sdLog: number, seed: number): number[] {
  const rng = makeRng(seed);
  const out: number[] = new Array(SAMPLES_PER_MISSION);
  for (let i = 0; i < SAMPLES_PER_MISSION; i++) {
    const u1 = Math.max(rng(), 1e-12);
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    out[i] = meanLog + sdLog * z;
  }
  return out;
}

function makeMissionEntry(meanLog: number, seed: number) {
  const samples = makeLogLambdaSamples(meanLog, SD_LOG, seed);
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance = samples.reduce((a, b) => a + (b - mean) * (b - mean), 0) / samples.length;
  return { log_lambda_samples: samples, mean_log_lambda: mean, sd_log_lambda: Math.sqrt(variance) };
}

function buildSyntheticPriors(): PriorsJson {
  const conditions: PriorsJson["conditions"] = {};
  let salt = PRIORS_SEED;
  // Pass 1 — legacy mission types, original order → identical salt sequence →
  // byte-identical λ to before this fix (no existing mission's behaviour moves).
  for (const c of ANALOG_CONDITIONS) {
    const meanLog = meanLogFor(c.kind);
    const missions: PriorsJson["conditions"][string]["missions"] = {};
    for (const m of LEGACY_MISSION_TYPES) {
      missions[m] = makeMissionEntry(meanLog, ++salt);
    }
    conditions[c.id] = {
      missions,
      vulnerability_beta:
        c.vulnerabilityCriteria.length > 0
          ? Object.fromEntries(
              c.vulnerabilityCriteria.map((cid) => [
                cid,
                // Family-specific β against z-scored higher-is-better criteria.
                // Negative β: HIGH-quality candidate (z>0) → β·z<0 → exp<1 → λ↓.
                // Magnitudes calibrated so worst-vs-best (4 SD spread, ±2 z units)
                // produces a meaningful 2-4× incidence multiplier spread.
                // Condition families present in ANALOG_CONDITIONS v1:
                //   psychiatric, team, physiologic, musculoskeletal, performance.
                // Future families (Iter-2+ ConditionFamily expansion) are cast via
                // string comparison to avoid TS2367 narrowing errors while keeping
                // forward-compatibility branches explicit.
                (c.family as string) === "psychiatric"      ? -0.4 :
                (c.family as string) === "behavioral"       ? -0.3 :
                (c.family as string) === "infectious"       ? -0.25 :
                (c.family as string) === "musculoskeletal"  ? -0.2 :
                (c.family as string) === "neurologic"       ? -0.3 :
                (c.family as string) === "GI"               ? -0.15 :
                (c.family as string) === "cardiovascular"   ? -0.25 :
                (c.family as string) === "respiratory"      ? -0.2 :
                (c.family as string) === "renal"            ? -0.15 :
                                                               -0.2,    // default (team, physiologic, performance)
              ]),
            )
          : {},
      worst_case_prob_q: 0.25,
      treated_lost_days_mean: 1.0,
      untreated_lost_days_mean: 4.0,
    };
  }
  // Pass 2 — additively cover any extra mission types (e.g. "thor" / short-22d).
  // Salt continues AFTER all legacy increments, so legacy λ are untouched; this
  // only ADDS coverage so no mission silently scores zero risk (CHI = 100 %).
  for (const c of ANALOG_CONDITIONS) {
    const meanLog = meanLogFor(c.kind);
    for (const m of EXTRA_MISSION_TYPES) {
      conditions[c.id].missions[m] = makeMissionEntry(meanLog, ++salt);
    }
  }
  return {
    model_version: "synthetic-iter3-ui-scaffold",
    fitted_at: "2026-05-19T00:00:00Z",
    conditions,
  };
}

export const SYNTHETIC_PRIORS: PriorsJson = buildSyntheticPriors();

export function synthesizeCrew(template: Candidate, size: number): Candidate[] {
  const crew: Candidate[] = new Array(size);
  for (let i = 0; i < size; i++) {
    crew[i] = {
      id: `${template.id}-clone-${i}`,
      alias: `${template.alias} · clone ${i + 1}`,
      scores: { ...template.scores },
    };
  }
  return crew;
}
