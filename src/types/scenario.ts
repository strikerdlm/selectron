// scope-expansion-3 (2026-05-19): accessibility tier for a Selectron candidate's
// selection-battery realisation. Tier 1 = low-resource analog program (free /
// open-source instruments on commodity hardware); Tier 2 = mid-budget research
// centre with commercial computerised tools; Tier 3 = real spaceflight / NASA-
// grade program with hardware-gated clinical instruments.
//
// Tier does NOT change which criteria Selectron scores — all 12 criteria are
// present at every tier. Tier only switches WHICH INSTRUMENT measures each
// criterion (and any scale transformation needed when a Tier-1 instrument has
// a different numeric range than the canonical Tier-3 instrument).
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
