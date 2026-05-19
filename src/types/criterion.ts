import type { AccessTier } from "./scenario";

export type CriterionInstrument = {
  /** Human-readable instrument name + version (e.g. "PEBL battery: DSST + PVT + Trail Making"). */
  instrument: string;
  /** Verified DOIs for THIS instrument's validation literature. */
  citations: string[];
  /**
   * Linear or note-only transform from the instrument's native scale to the
   * Criterion's canonical scale. E.g. PHQ-9 (0–27) → BDI-II canonical (0–63)
   * uses { multiplier: 2.33, note: "PHQ-9 × 2.33 → BDI-II equivalent" }.
   * Selectron applies the multiplier at score-entry time when this field is set.
   */
  scaleTransform?: {
    multiplier?: number;
    note?: string;
  };
  /** Tier-specific operational caveats — e.g. "DASS-21 is TRIAGE, not a psychiatric select-out gate". */
  notes?: string;
};

export type Criterion = {
  id: string;
  family: string;
  label: string;
  description: string;
  /**
   * Default instrument label — used when no tierInstruments map is populated.
   * Backward-compatible with the Iter-1 schema; treated as the Tier-3 default
   * when tierInstruments is populated.
   */
  instrument: string;
  scale: { min: number; max: number };
  higherIsBetter: boolean;
  /** Construct-level citation DOIs (instrument-independent literature). */
  citations: string[];
  /**
   * Per-tier instrument substitution chain. Optional for backward compatibility;
   * scope-expansion-3 populates this for all 12 placeholder criteria.
   */
  tierInstruments?: Record<AccessTier, CriterionInstrument>;
  /**
   * Lowest accessibility tier at which this criterion appears in the wizard.
   * - "minimum" → visible at all three tiers (Tier-1, 2, 3) — these are the
   *   8 DIY-feasible "core" tests of the battery
   * - "medium"  → visible at Tier-2 and Tier-3 — adds 2 commercial-license tests
   * - "elite"   → visible only at Tier-3 — adds 2 specialist-hardware/clinician tests
   * Default (when undefined) is "minimum" — full backward compatibility with the
   * pre-scope-expansion-3-followup behavior where every criterion ran at every tier.
   */
  minimumTier?: AccessTier;
};
