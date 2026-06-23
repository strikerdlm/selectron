// Compatibility re-export for the archived src/risk engine.
// Canonical source: src/engine/lxc-definitions.ts.
export {
  COLOR_RED_MIN,
  COLOR_YELLOW_MIN,
  CONSEQUENCE_BANDS_MISSION_OBJ,
  LIKELIHOOD_BANDS_IN_MISSION,
  LXC_PRIORITY_SCORES,
  RISK_IMPACT_CATEGORIES,
  lxcColor,
  lxcScore,
} from "@/engine/lxc-definitions";
export type {
  ConsequenceBand,
  ConsequenceLevel,
  LikelihoodBand,
  LikelihoodLevel,
  RiskColor,
} from "@/engine/lxc-definitions";
