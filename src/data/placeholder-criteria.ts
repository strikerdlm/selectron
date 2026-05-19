import type { Criterion } from "@/types";

// PLACEHOLDER set for Iter 1. Replaced in Iter 2 by docs/criteria.md output of Phase 0.
// Each criterion below is a defensible placeholder chosen so the end-to-end pipeline
// can be validated before the literature taxonomy is finalized.
export const PLACEHOLDER_CRITERIA: readonly Criterion[] = [
  {
    id: "psych.conscientiousness",
    family: "psychological",
    label: "Conscientiousness (Big Five)",
    description: "Tendency to be organized, responsible, and dependable under sustained workload.",
    instrument: "NEO-PI-R (T-score)",
    scale: { min: 0, max: 100 },
    higherIsBetter: true,
    citations: ["10.1037/0022-3514.88.1.139"],
  },
  {
    id: "psych.emotional_stability",
    family: "psychological",
    label: "Emotional stability",
    description: "Resilience to acute and chronic stress in isolated and confined environments.",
    instrument: "NEO-PI-R neuroticism (reversed, T-score)",
    scale: { min: 0, max: 100 },
    higherIsBetter: true,
    citations: ["10.3357/ASEM.2521.2009"],
  },
  {
    id: "physical.vo2max",
    family: "physical",
    label: "VO₂max",
    description: "Cardiorespiratory fitness baseline.",
    instrument: "Graded exercise test (mL/kg/min)",
    scale: { min: 20, max: 70 },
    higherIsBetter: true,
    citations: ["10.1152/japplphysiol.00756.2017"],
  },
  {
    id: "professional.technical_competence",
    family: "professional",
    label: "Technical competence",
    description: "Mission-relevant technical and operational skill, assessed via structured panel rubric.",
    instrument: "Structured behavioural rubric (1–10)",
    scale: { min: 1, max: 10 },
    higherIsBetter: true,
    citations: ["10.1518/001872008X312413"],
  },
  {
    id: "behavioral.teamwork",
    family: "behavioral",
    label: "Teamwork (BBI)",
    description: "Demonstrated capacity to operate effectively within a small isolated crew.",
    instrument: "Behavioural-based interview score (1–5)",
    scale: { min: 1, max: 5 },
    higherIsBetter: true,
    citations: ["10.3357/ASEM.4023.2014"],
  },
  // Diego scope expansion 2026-05-19: 7 new criteria from
  // research/2026-05-19_selection_test_battery_expansion.md (commit 5ee9840).
  // Spans cognitive / sensorimotor / psychological domains beyond the original 5.
  {
    id: "cognitive.nasa_cognition_battery",
    family: "cognitive",
    label: "Cognitive throughput (NASA Cognition Battery)",
    description:
      "Composite z-score across 10 subtests (PVT-B, DSST, AM, F2B, ERT, MRT, BART, VOLT, LOT, MPT) " +
      "captured on the same instrument NASA flies on the ISS. Predicts technical-task performance " +
      "under sleep restriction; d ≥ 0.65 under known stressor.",
    instrument: "NASA Cognition Test Battery — composite z-score (Basner et al. 2015)",
    // Operational range of the composite z relative to astronaut-cohort norms ≈ [-3, +3]
    scale: { min: -3, max: 3 },
    higherIsBetter: true,
    citations: ["10.3357/amhp.4343.2015", "10.3389/fphys.2024.1451269", "10.1038/s41526-020-00124-6"],
  },
  {
    id: "cognitive.pvt_b_lapses",
    family: "cognitive",
    label: "Vigilance — PVT-B baseline lapses (reversed)",
    description:
      "Lapse count (reaction time > 500 ms) on the 3-minute Psychomotor Vigilance Test Brief — the " +
      "ISS standard for catching dangerous slowing before EVAs. Lapses above the 75th percentile " +
      "flag trait vulnerability to sleep-restriction-induced impairment. Reversed: lower lapses → " +
      "higher Selectron z.",
    instrument: "PVT-B 3-min, lapse count (Basner 2011); reversed scale 0–60 lapses",
    scale: { min: 0, max: 60 },
    higherIsBetter: false,
    citations: ["10.1093/sleep/34.5.581"],
  },
  {
    id: "physical.sot5_equilibrium",
    family: "physical",
    label: "Sensorimotor balance (SOT-5 Equilibrium Score)",
    description:
      "NeuroCom Equitest SOT condition-5 score — sway-referenced platform with eyes closed, " +
      "isolates vestibular contribution. Required by NASA OCHMO; low pre-flight EQ predicts post-G-" +
      "transition fall risk on R+0 (91% in challenged subjects). Operational floor: EQ ≥ 50.",
    instrument: "SOT-5 Equilibrium Score (NeuroCom CDP; Reschke et al. 2009)",
    scale: { min: 0, max: 100 },
    higherIsBetter: true,
    citations: ["10.3357/asem.br06.2009"],
  },
  {
    id: "psych.resilience_cdrisc",
    family: "psychological",
    label: "Resilience (CD-RISC-25)",
    description:
      "Connor-Davidson Resilience Scale, 25-item self-report. Convergent r ≈ 0.83 with Kobasa " +
      "Hardiness; predicts post-isolation growth in Antarctic winter-over (R² = 0.30–0.45, Kokun & " +
      "Bakhmutova 2024). Complementary to Big-Five emotional stability — captures trait " +
      "bounce-back, not absence-of-neuroticism.",
    instrument: "CD-RISC-25 total score, 25 items × 0–4 Likert (Connor & Davidson 2003)",
    scale: { min: 0, max: 100 },
    higherIsBetter: true,
    citations: ["10.1002/da.10113"],
  },
  {
    id: "psych.emotional_intelligence",
    family: "psychological",
    label: "Emotional intelligence (MSCEIT EIQ)",
    description:
      "Mayer-Salovey-Caruso ability-based EI test — 4 branches (perceiving / using / understanding / " +
      "managing emotions). Meta-analytic ρ = 0.24–0.30 for job performance, incremental over IQ + Big " +
      "Five. Matters disproportionately in small isolated crews where misreading social signals " +
      "amplifies conflict.",
    instrument: "MSCEIT v2.0 standard score (M=100, SD=15); z-score input",
    // Standard-score range; z-score input via (raw - 100) / 15 → operational [-3, +3].
    scale: { min: -3, max: 3 },
    higherIsBetter: true,
    citations: ["10.1037/1528-3542.3.1.97"],
  },
  {
    id: "psych.mmpi2rf_eid",
    family: "psychological",
    label: "Psychiatric screen — MMPI-2-RF EID (reversed)",
    description:
      "Emotional-Internalising Dysfunction higher-order score from the MMPI-2-RF — the primary " +
      "psychiatric select-out instrument in NASA / ESA / Antarctic winter-over programs. Clinical " +
      "threshold ≥ 65T triggers specialist disposition; sub-clinical 60–64T elevates the " +
      "pMentalHealthIncident IMM vulnerability β. Reversed: lower T-score → higher Selectron z.",
    instrument: "MMPI-2-RF EID T-score (M=50, SD=10); reversed",
    scale: { min: 30, max: 120 },
    higherIsBetter: false,
    citations: ["10.1037/0033-2909.130.5.661"],
  },
  {
    id: "psych.bdi2_baseline",
    family: "psychological",
    label: "Depression-state baseline (BDI-II, reversed)",
    description:
      "Beck Depression Inventory-II total score at baseline. Captures emerging mood state " +
      "complementary to MMPI-2-RF (state vs trait). In Mars-500 the crew member whose BDI-II " +
      "trajectory climbed into the moderate range also produced the worst PVT lapses and the most " +
      "MC conflict. Threshold ≥ 20 → specialist flag. Reversed: lower score → higher z.",
    instrument: "BDI-II total score 0–63, 21 items (Beck et al. 1996); reversed",
    scale: { min: 0, max: 63 },
    higherIsBetter: false,
    citations: ["10.1207/s15327752jpa6703_13"],
  },
];
