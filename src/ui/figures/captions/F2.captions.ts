import type { CaptionBlock } from "../FigureCaption";

export function f2Caption(args: {
  chiMean: number;
  chiCi90: readonly [number, number];
  trials: number;
  seed: number;
  missionId: string;
  priorsVersion: string;
}): CaptionBlock {
  return {
    figureId: "F2",
    oneLine: `CHI posterior for mission ${args.missionId} (μ = ${(100 * args.chiMean).toFixed(1)}%, ` +
      `CI₉₀ ${(100 * args.chiCi90[0]).toFixed(1)}–${(100 * args.chiCi90[1]).toFixed(1)}%).`,
    methods:
      "56-bin histogram of CHI = 1 − QTL/(t·c) drawn from a 4-step IMM Monte-Carlo forward " +
      "simulator over the analog mission (occurrence → severity → treatment → CHI/QTL aggregation, " +
      "NASA-IMM canonical form per Antonsen 2022, Walton & Kerstman 2020). CI₉₀ shaded; posterior " +
      "mean overlaid as dashed line.",
    source: `Synthetic-iter3-ui-scaffold priors (Lognormal-Poisson shape matched to the test fixture, ` +
      `NOT a calibrated PyMC fit). Mission profile from src/data/analog-missions.ts.`,
    reproducibility: `seed=${args.seed}, trials=${args.trials.toLocaleString()}, ` +
      `model_version=${args.priorsVersion}, χ*=0.7.`,
  };
}
