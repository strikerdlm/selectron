// scope-expansion-3 (2026-05-19): accessibility tier for a Selectron candidate's
// selection-battery realisation. Tier 1 = low-resource analog program (free /
// open-source instruments on commodity hardware); Tier 2 = mid-budget research
// centre with commercial computerised tools; Tier 3 = real spaceflight / NASA-
// grade program with hardware-gated clinical instruments.
//
// Tier changes BOTH which criteria the wizard shows AND which instrument
// measures each visible criterion (with any scale transformation):
//
//   - Tier 1 (Minimum) — 8 DIY-feasible criteria (the "core" battery)
//   - Tier 2 (Medium)  — 10 criteria (adds 2 commercial-license tests)
//   - Tier 3 (Elite)   — 12 criteria (adds 2 specialist-hardware/clinician tests)
//
// The per-criterion `minimumTier` field in src/types/criterion.ts gates the
// filter; isCriterionAvailableAtTier(min, current) is the runtime check.
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
  const required = TIER_ORDINAL[minimumTier ?? "minimum"];
  const have = TIER_ORDINAL[currentTier];
  return have >= required;
}

export const TIER_LONG_DESCRIPTION: Record<AccessTier, string> = {
  minimum:
    "Free, open-source, or paper-based instruments on commodity hardware. IPIP-NEO-120, PEBL, " +
    "Cooper 12-min run, mCTSIB obstacle course, CD-RISC-10, TEIQue-SF, DASS-21 (triage only), PHQ-9. " +
    "DASS-21 positive screens MUST be referred to a licensed mental-health professional — DASS-21 " +
    "is not a psychiatric select-out gate at this tier.",
  medium:
    "Adds commercial computerized tools + clinical-psychology consultation. NEO-FFI, CogScreen-AE, " +
    "submaximal cycle ergometer, Wii Balance Board sway, CD-RISC-25, EQ-i 2.0, MMPI-2-RF (licensed " +
    "psychologist), BDI-II. Same construct coverage as Tier 1 with higher fidelity.",
  elite:
    "Full Tier-3 battery. NEO-PI-R (240-item with facets), NASA Cognition Battery (Joggle Research), " +
    "CPET with metabolic cart, NeuroCom Equitest CDP SOT-5, MSCEIT v2.0 ability-based EI, MMPI-2-RF + " +
    "specialist psychiatric interview, BDI-II serial trajectory. NASA/ESA/JAXA/Roscosmos selection grade.",
};
