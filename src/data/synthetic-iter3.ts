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
import { makeRng } from "@/engine/prng";

const PRIORS_SEED = 0xfeed;
const SAMPLES_PER_MISSION = 1000;

const MISSION_TYPES = ["antarctic", "mars500", "hi-seas", "mdrs", "emmpol"] as const;

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

function buildSyntheticPriors(): PriorsJson {
  const conditions: PriorsJson["conditions"] = {};
  let salt = PRIORS_SEED;
  for (const c of ANALOG_CONDITIONS) {
    const isEvent = c.kind === "event";
    const meanLog = isEvent ? Math.log(0.05) : Math.log(0.0005);
    const sdLog = 0.3;
    const missions: PriorsJson["conditions"][string]["missions"] = {};
    for (const m of MISSION_TYPES) {
      const samples = makeLogLambdaSamples(meanLog, sdLog, ++salt);
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const variance =
        samples.reduce((a, b) => a + (b - mean) * (b - mean), 0) / samples.length;
      missions[m] = {
        log_lambda_samples: samples,
        mean_log_lambda: mean,
        sd_log_lambda: Math.sqrt(variance),
      };
    }
    conditions[c.id] = {
      missions,
      vulnerability_beta:
        c.vulnerabilityCriteria.length > 0
          ? Object.fromEntries(
              c.vulnerabilityCriteria.map((cid) => [
                cid,
                c.family === "psychiatric" ? -0.05 : 0.0,
              ]),
            )
          : {},
      worst_case_prob_q: 0.25,
      treated_lost_days_mean: 1.0,
      untreated_lost_days_mean: 4.0,
    };
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
