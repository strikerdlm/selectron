import type { CaptionBlock } from "../FigureCaption";
import type { AccessTier } from "@/types";
import { TIER_LABEL } from "@/types";

export function f2Caption(args: {
  chiMean: number;
  chiCi90: readonly [number, number];
  trials: number;
  seed: number;
  missionId: string;
  priorsVersion: string;
  accessTier: AccessTier; // scope-expansion-3
}): CaptionBlock {
  return {
    figureId: "F2",
    oneLine: `CHI simulation distribution for mission ${args.missionId} (μ = ${(100 * args.chiMean).toFixed(1)}%, ` +
      `CI₉₀ ${(100 * args.chiCi90[0]).toFixed(1)}–${(100 * args.chiCi90[1]).toFixed(1)}%; tier · ${TIER_LABEL[args.accessTier]}).`,
    methods:
      "56-bin histogram of CHI = 1 − QTL/(t·c) drawn from a 4-step IMM Monte-Carlo forward " +
      "simulator over the analog mission (occurrence → severity → treatment → CHI/QTL aggregation, " +
      "NASA-IMM canonical form per Antonsen 2022, Walton & Kerstman 2020). CI₉₀ shaded; simulation " +
      "mean overlaid as dashed line.",
    source: `Synthetic-iter3-ui-scaffold priors (Lognormal-Poisson shape matched to the test fixture, ` +
      `NOT a calibrated PyMC fit). Mission profile from src/data/analog-missions.ts. ` +
      `Accessibility tier: ${TIER_LABEL[args.accessTier]}.`,
    reproducibility: `seed=${args.seed}, trials=${args.trials.toLocaleString()}, ` +
      `model_version=${args.priorsVersion}, χ*=0.7.`,
  };
}
