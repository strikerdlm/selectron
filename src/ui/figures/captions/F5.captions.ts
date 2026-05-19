import type { CaptionBlock } from "../FigureCaption";
import type { Criterion } from "@/types";

export function f5Caption(criterion: Criterion, enteredValue?: number): CaptionBlock {
  return {
    figureId: "F5",
    oneLine: `Reference distribution for ${criterion.label}${enteredValue !== undefined ? ` (entered: ${enteredValue.toFixed(1)})` : ""}.`,
    methods:
      `Mini histogram of a placeholder reference distribution: N(μ=${((criterion.scale.min + criterion.scale.max) / 2).toFixed(1)}, ` +
      `σ=${((criterion.scale.max - criterion.scale.min) / 6).toFixed(1)}). ` +
      `The entered candidate value is overlaid as a vertical marker. ` +
      `In Phase 3F-v2 this is replaced by an empirical distribution over saved candidates once N ≥ 10.`,
    source: `Criterion: ${criterion.id} (${criterion.instrument ?? "no instrument metadata"}).`,
    reproducibility: "Deterministic — distribution shape is a function of the criterion's scale bounds.",
  };
}
