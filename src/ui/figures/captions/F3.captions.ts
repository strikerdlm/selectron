import type { CaptionBlock } from "../FigureCaption";

export function f3Caption(args: {
  totalQtlMean: number;
  trials: number;
  seed: number;
  missionId: string;
  priorsVersion: string;
}): CaptionBlock {
  return {
    figureId: "F3",
    oneLine: `Per-condition QTL contribution for mission ${args.missionId} (total μ = ${args.totalQtlMean.toFixed(2)} crew-days).`,
    methods:
      "Horizontal stacked bar of mean lost crew-days (QTL) per condition, sorted descending. " +
      "Segments coloured by ConditionFamily (psychiatric / physiologic / musculoskeletal / " +
      "performance / team). 90% CI shown as whiskers at each segment boundary.",
    source: "Per-condition QTL aggregated across Monte-Carlo trials per spec §3.3.",
    reproducibility: `seed=${args.seed}, trials=${args.trials.toLocaleString()}, model_version=${args.priorsVersion}.`,
  };
}
