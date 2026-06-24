import type { ScoreDistribution } from "@/types";
import type { AccessTier } from "@/types";
import { TIER_LABEL } from "@/types";
import type { CaptionBlock } from "../FigureCaption";

const SOFTWARE_VERSION = "ECharts 6.x via Selectron @ HEAD";

export function f1Caption(
  scoreDistribution: ScoreDistribution,
  seed: number,
  alias: string,
  accessTier: AccessTier,
): CaptionBlock {
  return {
    figureId: "F1",
    oneLine: `Uncertain-weight MCDA score distribution for ${alias} (n = ${scoreDistribution.samples.length.toLocaleString()} draws; tier · ${TIER_LABEL[accessTier]}).`,
    methods:
      `56-bin histogram of the MCDA score induced by uncertain Dirichlet criterion weights (Iter-1 engine: ` +
      `S_i = Σ w_k · z(x_{i,k}) where w ~ Dirichlet(1,…,1) and z is per-criterion affine ` +
      `normalisation to [0,1]). Central 90% score interval shaded; distribution mean overlaid as dashed line. ` +
      `Software: ${SOFTWARE_VERSION}.`,
    source:
      `Synthetic-iter1-engine. Computed in-browser at render time; no DB cache. ` +
      `Accessibility tier: ${TIER_LABEL[accessTier]}.`,
    reproducibility: `seed=${seed}, draws=${scoreDistribution.samples.length}, alpha=[1,…,1].`,
  };
}
