import type { CaptionBlock } from "../FigureCaption";

export function f4Caption(args: { n: number }): CaptionBlock {
  return {
    figureId: "F4",
    oneLine: `CHI per saved candidate, sorted descending (n = ${args.n}).`,
    methods:
      "Lollipop / dot-with-stem plot of latest-simulation CHI per candidate. Central 90% simulation interval shown as whiskers. " +
      "Reads the most recent simSessions row per candidate.",
    source: "Selectron Dexie DB · simSessions table.",
    reproducibility: "Each underlying CHI is reproducible from its simSession's seed + trials + priorsVersion.",
  };
}
