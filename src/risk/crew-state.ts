import type { Candidate, Criterion } from "@/types";
import { zScoreAgainstScale } from "@/engine/normalize-cohort";
import { sampleFrailty, sampleStandardNormal } from "./incidence";

type Rng = () => number;

export type TeamHyper = {
  crewFrailtyPhi: number;
  memberFrailtyPhi: number;
  // Note: piUnstableBase must be in (0, 1) exclusive; values of exactly 0 or 1
  // produce ±Infinity for alpha0 via Math.log. The priorsSchema bounds this to
  // the open interval, so ±Infinity cannot arise in practice.
  piUnstableBase: number;
  alphaFit: number;
  sigmaLogBeta: number;
  fitCriterionId: string; // proxy for person-group fit (Iter-1: behavioral.teamwork)
};

export type TrialLatentState = {
  latentClass: 0 | 1;
  memberFrailty: number[];
  crewFrailty: number;
  betaLogShift: number; // β_trial = β · exp(betaLogShift)
};

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Mean z of the fit-proxy criterion across the crew (0 if unavailable). */
function meanFitZ(crew: readonly Candidate[], idx: ReadonlyMap<string, Criterion>, fitId: string): number {
  const c = idx.get(fitId);
  if (!c) return 0;
  let sum = 0, k = 0;
  for (const m of crew) {
    const raw = m.scores[fitId];
    if (raw === undefined || !Number.isFinite(raw)) continue;
    const z = zScoreAgainstScale(raw, c.scale);
    sum += c.higherIsBetter ? z : -z;
    k++;
  }
  return k === 0 ? 0 : sum / k;
}

/** Phase 0: draw the shared per-trial latent state from a dedicated substream. */
export function drawTrialLatentState(
  crew: readonly Candidate[],
  idx: ReadonlyMap<string, Criterion>,
  hyper: TeamHyper,
  rng: Rng,
): TrialLatentState {
  // A3 TIME×SELECTION BRIDGE (peer review 2026-06-07): crew fit (mean teamwork z)
  // shifts the latent-class mix. piUnstableBase is the Tu-2024-FIT split (≈0.658);
  // alphaFit<0 lowers P(unstable) for a higher-fit (selected/trained) crew, so a
  // selected crew gets the flat trajectory and a random crew the back-loaded rising
  // one. This is how the model couples selection to time-in-confinement. The split
  // is fit; alphaFit and the ramp shape (temporal_a/p) are operator-supplied — see
  // src/data/synthetic-iter3.ts.
  const fitZ = meanFitZ(crew, idx, hyper.fitCriterionId);
  const alpha0 = Math.log(hyper.piUnstableBase / (1 - hyper.piUnstableBase));
  const piUnstable = logistic(alpha0 + hyper.alphaFit * fitZ);
  const latentClass: 0 | 1 = rng() < piUnstable ? 1 : 0;
  const memberFrailty = crew.map(() => sampleFrailty(rng, hyper.memberFrailtyPhi));
  const crewFrailty = sampleFrailty(rng, hyper.crewFrailtyPhi);
  const betaLogShift = hyper.sigmaLogBeta * sampleStandardNormal(rng);
  return { latentClass, memberFrailty, crewFrailty, betaLogShift };
}
