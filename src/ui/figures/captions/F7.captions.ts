import type { CaptionBlock } from "../FigureCaption";

export function f7Caption(args: { trials: number; seed: number; priorsVersion: string }): CaptionBlock {
  return {
    figureId: "F7",
    oneLine: "CHI posterior for this candidate across all 5 analog missions (small multiples).",
    methods:
      "Five-panel small-multiples grid of CHI posteriors, one per analog mission, with shared CHI axis. " +
      "Same 4-step IMM Monte-Carlo as F2; cached per mission in simSessions with a shared notes='comparison-run' tag.",
    source: "Selectron Dexie DB · simSessions table (rows tagged comparison-run).",
    reproducibility: `seed=${args.seed}, trials=${args.trials.toLocaleString()}/mission, model_version=${args.priorsVersion}.`,
  };
}
