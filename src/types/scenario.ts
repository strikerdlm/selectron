// scope-expansion-3 (2026-05-19), revised for analog-only audit (2026-06-22):
// accessibility tier for a Selectron candidate's selection-battery realisation.
// Tier 1 = low-resource analog program; Tier 2 = mid-budget research centre;
// Tier 3 = agency-grade/specialist instrumentation.
//
// Tier now changes instrument fidelity, not the construct set. A Minimum-tier
// candidate and an Elite-tier candidate should still be scored on the same
// constructs unless a criterion truly lacks a tier instrument. This avoids the
// old behavior where adding a higher-tier instrument changed every active
// Dirichlet mean weight from 1/K to a different 1/K solely because K changed.
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
  _minimumTier: AccessTier | undefined,
  _currentTier: AccessTier,
): boolean {
  return true;
}

export const TIER_LONG_DESCRIPTION: Record<AccessTier, string> = {
  minimum:
    "Free, open-source, or paper-based instruments on commodity hardware. IPIP-NEO-120, PEBL, " +
    "Cooper 12-min run, mCTSIB obstacle course, CD-RISC-10, TEIQue-SF, DASS-21 (triage only), PHQ-9. " +
    "DASS-21 positive screens must be referred to a licensed mental-health professional — DASS-21 " +
    "is not a Selectron psychiatric disposition boundary.",
  medium:
    "Adds commercial computerized tools + clinical-psychology consultation. NEO-FFI, CogScreen-AE, " +
    "submaximal cycle ergometer, Wii Balance Board sway, CD-RISC-25, EQ-i 2.0, MMPI-2-RF (licensed " +
    "psychologist), BDI-II. Same construct coverage as Tier 1 with higher fidelity.",
  elite:
    "Full Tier-3 battery. NEO-PI-R (240-item with facets), NASA Cognition Battery (Joggle Research), " +
    "CPET with metabolic cart, NeuroCom Equitest CDP SOT-5, MSCEIT v2.0 ability-based EI, MMPI-2-RF + " +
    "specialist psychiatric interview, BDI-II serial trajectory. This tier mirrors agency-grade instrumentation but remains demo-only.",
};
