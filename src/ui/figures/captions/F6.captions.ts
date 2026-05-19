import type { CaptionBlock } from "../FigureCaption";

export function f6Caption(args: { totalScore: number }): CaptionBlock {
  return {
    figureId: "F6",
    oneLine: `Per-criterion contribution to total MCDA score (total μ = ${(100 * args.totalScore).toFixed(1)}%).`,
    methods:
      "Radar plot of weighted per-criterion contribution w̄_k · z(x_k), where w̄_k is the " +
      "posterior mean Dirichlet weight (closed-form α_k/Σα_l with α=(1,…,1) → 1/K) and " +
      "z(x_k) is the normalised criterion score in [0,1].",
    source: "Computed in-browser from the current criterionEntries.",
    reproducibility: "Deterministic for given criterion scores; no Monte-Carlo.",
  };
}
