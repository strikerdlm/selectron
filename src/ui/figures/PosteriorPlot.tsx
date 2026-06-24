import type { AccessTier, ScoreDistribution } from "@/types";
import { ScoreDistributionPlot } from "./ScoreDistributionPlot";

export { ScoreDistributionPlot } from "./ScoreDistributionPlot";

/** @deprecated Use ScoreDistributionPlot for Stage-A MCDA outputs. */
export function PosteriorPlot({
  posterior,
  seed = 0xc0ffee,
  alias = "—",
  accessTier = "minimum",
}: {
  posterior: ScoreDistribution;
  seed?: number;
  alias?: string;
  accessTier?: AccessTier;
}) {
  return (
    <ScoreDistributionPlot
      scoreDistribution={posterior}
      seed={seed}
      alias={alias}
      accessTier={accessTier}
    />
  );
}
