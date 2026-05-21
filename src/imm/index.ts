// src/imm/index.ts — P1 public barrel (T34)
export * from "./types";
export { IMM_CONDITIONS } from "./conditions";
export { loadIMMPriors, validatePriorsJson } from "./priors";
export { IMM_KITS, computeRAF, customKit } from "./kits";
export { runIMMTrial, simulateIMM } from "./simulate";
export type { IMMTrialResult, IMMTrialOpts } from "./simulate";
export {
  samplePoisson, sampleLognormal, sampleLognormalPoisson,
  sampleGammaPoisson, sampleBeta, sampleBetaBernoulli, samplePoissonProcess,
} from "./incidence";
export { sampleBetaPert, concurrentFI } from "./outcomes";
export { interpolateBetaPertByRAF } from "./treatment";
export { sampleSeverity } from "./severity";
export { calibrateTierCMultipliers, K15_TABLE1_REF, K15_REFERENCE_CREW } from "./calibration";
export type { CalibrationResult } from "./calibration";
