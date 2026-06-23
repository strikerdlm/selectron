import type { CaptionBlock } from "../FigureCaption";

export function f7Caption(args: {
  trials: number;
  /** Base seed (panel 0). Missions k=0..missionCount-1 use seed seedBase+k. */
  seedBase: number;
  missionCount: number;
  priorsVersion: string;
}): CaptionBlock {
  const seedEnd = (args.seedBase + args.missionCount - 1) >>> 0;
  return {
    figureId: "F7",
    oneLine: "CHI simulation distribution for this candidate across all 5 analog missions (small multiples).",
    methods:
      "Five-panel small-multiples grid of CHI simulation distributions, one per analog mission, with shared CHI axis. " +
      "Same 4-step IMM Monte-Carlo as F2; cached per mission in simSessions with a shared notes='comparison-run' tag.",
    source: "Selectron Dexie DB · simSessions table (rows tagged comparison-run).",
    reproducibility:
      `seeds=0x${args.seedBase.toString(16)}..0x${seedEnd.toString(16)} (one per mission), ` +
      `trials=${args.trials.toLocaleString()}/mission, model_version=${args.priorsVersion}.`,
  };
}
