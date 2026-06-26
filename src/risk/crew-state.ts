import type { Candidate, Criterion } from "@/types";
import { permissiveScaleRelativeScore } from "@/engine/normalize-cohort";
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

/** Mean scale-relative coordinate of the fit-proxy criterion across the crew (0 if unavailable). */
function meanFitCoordinate(crew: readonly Candidate[], idx: ReadonlyMap<string, Criterion>, fitId: string): number {
  const c = idx.get(fitId);
  if (!c) return 0;
  let sum = 0, k = 0;
  for (const m of crew) {
    const raw = m.scores[fitId];
    if (raw === undefined || !Number.isFinite(raw)) continue;
    const coordinate = permissiveScaleRelativeScore(raw, c.scale);
    sum += c.higherIsBetter ? coordinate : -coordinate;
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
  const fitCoordinate = meanFitCoordinate(crew, idx, hyper.fitCriterionId);
  const alpha0 = Math.log(hyper.piUnstableBase / (1 - hyper.piUnstableBase));
  const piUnstable = logistic(alpha0 + hyper.alphaFit * fitCoordinate);
  const latentClass: 0 | 1 = rng() < piUnstable ? 1 : 0;
  const memberFrailty = crew.map(() => sampleFrailty(rng, hyper.memberFrailtyPhi));
  const crewFrailty = sampleFrailty(rng, hyper.crewFrailtyPhi);
  const betaLogShift = hyper.sigmaLogBeta * sampleStandardNormal(rng);
  return { latentClass, memberFrailty, crewFrailty, betaLogShift };
}
