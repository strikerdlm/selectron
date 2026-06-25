// scope-expansion-3 (2026-05-19), revised for analog-only audit (2026-06-22):
// accessibility tier for a Selectron candidate's selection-battery realisation.
// Tier 1 = low-resource analog program; Tier 2 = mid-budget research centre;
// Tier 3 = agency-grade/specialist instrumentation.
//
// Tier changes which instruments can produce a comparable canonical score.
// Criteria whose lower-tier substitutes do not have an accepted/proposal
// crosswalk are unavailable at that tier instead of being forced onto the
// canonical scale. This makes the active MCDA dimension explicit and avoids
// treating DASS-21, TEIQue-SF, or FMT values as MMPI/MSCEIT/SOT scores.
//
// See research/2026-05-19_test_battery_tiers.md for the per-criterion × per-
// tier instrument table.

export type AccessTier = "minimum" | "medium" | "elite";

export const ACCESS_TIERS: readonly AccessTier[] = ["minimum", "medium", "elite"];

export const TIER_LABEL: Record<AccessTier, string> = {
  minimum: "Minimum",
  medium: "Medium",
  elite: "Elite (real spaceflight)",
};

export const TIER_SHORT_DESCRIPTION: Record<AccessTier, string> = {
  minimum: "Low-resource analog program · paper-based + open-source · commodity laptop · budget < USD 5 k",
  medium: "Well-equipped research centre · commercial software + clinical psychology consult · USD 5–50 k",
  elite: "Real spaceflight / NASA-grade · CDP balance + metabolic cart + sleep lab · agency staff",
};

// Ordinal — lower tier is more accessible. Used to compare a Criterion's
// `minimumTier` against the user's chosen tier:
//   `tierOrdinal(criterion.minimumTier) <= tierOrdinal(currentTier)` is true
// iff the criterion should be visible at the current tier.
export const TIER_ORDINAL: Record<AccessTier, number> = {
  minimum: 0,
  medium: 1,
  elite: 2,
};

export function isCriterionAvailableAtTier(
  minimumTier: AccessTier | undefined,
  currentTier: AccessTier,
): boolean {
  return TIER_ORDINAL[currentTier] >= TIER_ORDINAL[minimumTier ?? "minimum"];
}

export const TIER_LONG_DESCRIPTION: Record<AccessTier, string> = {
  minimum:
    "Free, open-source, or paper-based instruments on commodity hardware. IPIP-NEO-120, PEBL, " +
    "Cooper 12-min run, CD-RISC-10, PHQ-9, and other scoreable demo instruments. " +
    "mCTSIB/FMT, TEIQue-SF, and DASS-21 are documented as non-comparable or triage-only rather than " +
    "converted to SOT-5, MSCEIT, or MMPI-2-RF scores. " +
    "DASS-21 positive screens must be referred to a licensed mental-health professional — DASS-21 " +
    "is not a Selectron psychiatric disposition boundary.",
  medium:
    "Adds commercial computerized tools + clinical-psychology consultation. NEO-FFI, CogScreen-AE, " +
    "submaximal cycle ergometer, Wii Balance Board sway, CD-RISC-25, MMPI-2-RF (licensed " +
    "psychologist), and BDI-II. EQ-i 2.0 is documented but not converted into an MSCEIT ability score.",
  elite:
    "Full Tier-3 battery. NEO-PI-R (240-item with facets), NASA Cognition Battery (Joggle Research), " +
    "CPET with metabolic cart, NeuroCom Equitest CDP SOT-5, MSCEIT v2.0 ability-based EI, MMPI-2-RF + " +
    "specialist psychiatric interview, BDI-II serial trajectory. This tier mirrors agency-grade instrumentation but remains demo-only.",
};
