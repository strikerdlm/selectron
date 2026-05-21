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
    minimumTier: "minimum",
    tierInstruments: {
      minimum: {
        instrument: "IPIP-NEO-120 (free, public domain; ipip.ori.org)",
        citations: ["10.1016/j.jrp.2014.05.003"],
        notes: "Johnson 2014 T-score equivalent to NEO-PI-R; DOI flagged for manual verification.",
      },
      medium: {
        instrument: "NEO-FFI (60-item; PAR Inc., ~USD 60/set)",
        citations: ["10.1037/0022-3514.88.1.139"],
      },
      elite: {
        instrument: "NEO-PI-R (240-item; Pearson; licensed psychologist required)",
        citations: ["10.1037/0022-3514.88.1.139"],
      },
    },
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
    minimumTier: "minimum",
    tierInstruments: {
      minimum: {
        instrument: "IPIP-NEO-120 Neuroticism scale (reversed; free)",
        citations: ["10.1016/j.jrp.2014.05.003"],
        notes: "DOI flagged for manual verification.",
      },
      medium: {
        instrument: "NEO-FFI Neuroticism (reversed, T-score; PAR Inc.)",
        citations: ["10.3357/ASEM.2521.2009"],
      },
      elite: {
        instrument: "NEO-PI-R Neuroticism facets N1–N6 (full 240-item; Pearson)",
        citations: ["10.3357/ASEM.2521.2009"],
      },
    },
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
    minimumTier: "minimum",
    tierInstruments: {
      minimum: {
        instrument: "Cooper 12-minute run/walk test (free; stopwatch + measured track)",
        citations: ["10.1001/jama.203.3.201"],
        notes: "Cooper 1968 — verified via Scite (Kenneth H. Cooper, JAMA 203(3):201–204, 322 citations). Cross-validation with CPET r=0.90 in young adults.",
      },
      medium: {
        instrument: "Submaximal cycle ergometer (Åstrand-Rhyming nomogram; ~USD 1–5 k)",
        citations: ["10.1152/japplphysiol.00756.2017"],
      },
      elite: {
        instrument: "Maximal CPET with metabolic cart (VO2peak direct measure, mL/kg/min)",
        citations: ["10.1152/japplphysiol.00756.2017"],
        notes: "OCHMO-STD-100.1A spaceflight medical clearance.",
      },
    },
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
    minimumTier: "minimum",
    tierInstruments: {
      minimum: {
        instrument: "Structured behavioural rubric (paper/checklist; 1–10 panel rating)",
        citations: ["10.1518/001872008X312413"],
      },
      medium: {
        instrument: "Structured behavioural rubric (panel + reference check)",
        citations: ["10.1518/001872008X312413"],
      },
      elite: {
        instrument: "Multi-rater assessment centre (structured rubric + simulation scenario + peer rating)",
        citations: ["10.1518/001872008X312413"],
      },
    },
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
    minimumTier: "minimum",
    tierInstruments: {
      minimum: {
        instrument: "Behavioural-based interview (BBI; paper rubric; 1–5 scale)",
        citations: ["10.3357/ASEM.4023.2014"],
      },
      medium: {
        instrument: "BBI + extended scenario probes (1–5 panel rating)",
        citations: ["10.3357/ASEM.4023.2014"],
      },
      elite: {
        instrument: "MATB-II or HERA group simulation observer rating",
        citations: ["10.3357/ASEM.4023.2014"],
      },
    },
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
    // Gate B — cognitive floor: composite z < -2.0 (2 SDs below the astronaut-cohort norm) is the
    // select-out threshold derived from Basner et al. 2015 normative data for the NASA Cognition
    // Battery. A z ≤ -2 corresponds to the 2nd percentile of the astronaut-cohort distribution —
    // operationally inconsistent with mission-critical decision-making under sleep restriction / G-load.
    // Authority: Basner M, Mollicone D, Dinges DF (2011); Basner M et al. (2015) 10.3357/amhp.4343.2015.
    gateThreshold: { operator: "fail-if-below", value: -2.0 },
    citations: ["10.3357/amhp.4343.2015", "10.3389/fphys.2024.1451269", "10.1038/s41526-020-00124-6"],
    minimumTier: "medium",
    tierInstruments: {
      minimum: {
        instrument: "PEBL battery (free, open-source): PVT module + DSST equivalent (Digit Span + Symbol Coding) + Trail Making",
        citations: ["10.7717/peerj.1460"],
        notes: "Piper et al. 2015 PMID 26713233 verified; covers NASA CB's highest-validity subtests at zero cost.",
      },
      medium: {
        instrument: "CogScreen-AE (PAR Inc.; commercial; ~USD 400–900; aviation-normed)",
        citations: [],
        notes: "Primary reference: Kay GG (1995) CogScreen-AE Professional Manual, PAR Inc. — not DOI-indexed. Verify current price at par.iagc.com.",
      },
      elite: {
        instrument: "NASA Cognition Battery (Basner et al. 2015; Joggle Research / Pulsar Informatics; institutional subscription)",
        citations: ["10.3357/amhp.4343.2015", "10.3389/fphys.2024.1451269"],
      },
    },
  },
  {
    // scope-expansion-3 follow-up (2026-05-19): renamed from cognitive.pvt_b_lapses
    // to cognitive.pvt_b_rt_ms — Diego pointed out he has the NASA PVT iOS app
    // (free), and the iOS app's headline output is mean reaction time in ms (not
    // lapse count). Mean RT is also the more interpretable + comparable metric
    // across populations. The lapse count is still tracked internally by the
    // app but the primary score we record in Selectron is mean RT (ms).
    id: "cognitive.pvt_b_rt_ms",
    family: "cognitive",
    label: "Vigilance — PVT-B reaction time",
    description:
      "Mean reaction time (in milliseconds) on the 3-minute Psychomotor Vigilance Test Brief — " +
      "the ISS standard for detecting dangerous slowing before EVAs. Operational range for adults: " +
      "200–500 ms; <250 ms = elite vigilance, 250–300 ms = typical, >350 ms = sleep-restriction " +
      "impairment, >500 ms = a 'lapse' (Dinges et al. 1991 criterion). Lower RT means better " +
      "sustained-attention performance.",
    instrument: "PVT-B 3-min, mean RT in ms (Basner 2011; NASA PVT iOS app at par.iagc.com)",
    // Scale: 200 ms (elite floor) to 500 ms (lapse threshold).
    scale: { min: 200, max: 500 },
    higherIsBetter: false, // shorter RT = higher Selectron z
    citations: ["10.1093/sleep/34.5.581"],
    minimumTier: "minimum", // 8-of-12 DIY-feasible core
    tierInstruments: {
      minimum: {
        instrument: "NASA PVT (iOS app, FREE) — distributed by NASA Behavioral Health & Performance lab; same engine as the ISS PVT-B reaction-self-test. Records mean RT, fastest 10%, slowest 10%, and lapses (RT > 500 ms).",
        citations: ["10.1093/sleep/34.5.581"],
        notes: "Diego confirms NASA PVT iOS app is accessible at no cost — preferred Tier-1 PVT instrument. PEBL PVT module is a cross-platform fallback if iOS is unavailable.",
      },
      medium: {
        instrument: "NASA PVT (iOS app, free) or commercial Pulsar Informatics PVT-B (Windows/tablet; ~USD 200–500/yr).",
        citations: ["10.1093/sleep/34.5.581"],
        notes: "At Tier 2 the same NASA PVT app is still defensible; the commercial Pulsar version is a richer-norms alternative when a research license is in budget.",
      },
      elite: {
        instrument: "PVT-B embedded within the NASA Cognition Battery (same Joggle platform; avoids double-counting the subtest).",
        citations: ["10.1093/sleep/34.5.581"],
      },
    },
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
    minimumTier: "elite",
    tierInstruments: {
      minimum: {
        instrument: "mCTSIB (foam pad standing × 4 conditions × 30 s) + Functional Mobility Test obstacle course (TTC, seconds)",
        citations: ["10.1007/s00221-010-2171-0"],
        scaleTransform: {
          note: "FMT time-to-complete (seconds, lower=better) requires inverse mapping to SOT-5 EQ canonical 0–100 scale (higher=better). Empirical calibration TBD — flag for Diego.",
        },
        notes: "Mulavara 2010 ISS post-flight locomotor function validation; loses vestibular-isolation specificity of SOT-5.",
      },
      medium: {
        instrument: "Wii Balance Board + BalanceTesting software (consumer-grade force plate, ~USD 150–300)",
        citations: ["10.3389/fphys.2015.00038"],
        notes: "Paillard & Noé 2015 validation at ±5% vs NeuroCom CDP; DOI flagged for manual verification.",
      },
      elite: {
        instrument: "NeuroCom Equitest CDP — SOT-5 Equilibrium Score (sway-referenced platform; eyes closed)",
        citations: ["10.3389/fphys.2018.01680", "10.3389/fncir.2021.723504"],
        notes: "OCHMO standard; 91% fall rate on R+0 in SOT-5M-challenged subjects.",
      },
    },
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
    minimumTier: "minimum",
    tierInstruments: {
      minimum: {
        instrument: "CD-RISC-10 (10-item; free for non-commercial research; CDRisc.com author permission)",
        citations: ["10.1002/jts.20271"],
        scaleTransform: {
          multiplier: 2.5,
          note: "CD-RISC-10 native 0–40 → ×2.5 → canonical 0–100 scale matching CD-RISC-25.",
        },
        notes: "Campbell-Sills & Stein 2007 α≈0.85; DOI flagged for manual verification.",
      },
      medium: {
        instrument: "CD-RISC-25 (25-item full version; free for non-commercial research)",
        citations: ["10.1002/da.10113"],
      },
      elite: {
        instrument: "CD-RISC-25 + supplemental semi-structured clinical interview",
        citations: ["10.1002/da.10113"],
      },
    },
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
    minimumTier: "medium",
    tierInstruments: {
      minimum: {
        instrument: "TEIQue-SF (Trait Emotional Intelligence Questionnaire — Short Form; 30-item; free for research at psychometriclab.com)",
        citations: ["10.1007/978-0-387-88370-0_5"],
        notes: "Petrides 2009 — verified via Scite (K. V. Petrides, Springer book chapter 'Psychometric Properties of the TEIQue', 1333 citations). α≈0.88; convergent validity with MSCEIT and EQ-i established in multiple meta-analyses.",
      },
      medium: {
        instrument: "EQ-i 2.0 (MHS Inc.; self-report; ~USD 30–50/administration)",
        citations: ["10.1002/job.714"],
      },
      elite: {
        instrument: "MSCEIT v2.0 (MHS; ability-based; 141-item; 4 branches)",
        citations: ["10.1002/job.714"],
      },
    },
  },
  {
    id: "psych.mmpi2rf_eid",
    family: "psychological",
    label: "Psychiatric screen — MMPI-2-RF EID",
    description:
      "Emotional-Internalising Dysfunction higher-order score from the MMPI-2-RF — the primary " +
      "psychiatric select-out instrument in NASA / ESA / Antarctic winter-over programs. Clinical " +
      "threshold ≥ 65T triggers specialist disposition; sub-clinical 60–64T elevates the " +
      "pMentalHealthIncident IMM vulnerability β. Reversed: lower T-score → higher Selectron z.",
    instrument: "MMPI-2-RF EID T-score (M=50, SD=10); reversed",
    scale: { min: 30, max: 120 },
    higherIsBetter: false,
    // Gate A — psychiatric select-out: EID T ≥ 65 is the NASA/ESA/Antarctic operational
    // disqualification threshold (2 SDs above population mean on an internalizingdysfunction scale).
    // fail-if-above: 65 means any candidate with raw EID T-score > 65 is disqualified.
    // Authority: Ben-Porath & Tellegen (2008/2011) MMPI-2-RF manual; Santy (1994) astronaut selection
    // psychiatric standards; NASA OCHMO-STD-100.1A §4.3 behavioural health clearance criteria.
    gateThreshold: { operator: "fail-if-above", value: 65 },
    citations: ["10.1037/0033-2909.130.5.661"],
    minimumTier: "elite",
    tierInstruments: {
      minimum: {
        instrument: "DASS-21 (Depression Anxiety Stress Scales, 21-item; free, public domain; Lovibond & Lovibond 1995) — TRIAGE FLAG ONLY",
        citations: [],
        notes:
          "NOT a psychiatric select-out gate at this tier. DASS-21 depression subscale ≥ 14 (severe) " +
          "MUST trigger external referral to a licensed mental-health professional before mission deployment. " +
          "Lovibond & Lovibond 1995 — original monograph, not DOI-indexed.",
      },
      medium: {
        instrument: "MMPI-2-RF (Pearson; ~USD 15–30/administration; licensed psychologist required)",
        citations: ["10.1037/0033-2909.130.5.661"],
      },
      elite: {
        instrument: "MMPI-2-RF (full 338-item) + supplemental psychiatric interview by clinical psychiatrist",
        citations: ["10.1037/0033-2909.130.5.661"],
      },
    },
  },
  {
    id: "psych.bdi2_baseline",
    family: "psychological",
    label: "Depression-state baseline (BDI-II)",
    description:
      "Beck Depression Inventory-II total score at baseline. Captures emerging mood state " +
      "complementary to MMPI-2-RF (state vs trait). In Mars-500 the crew member whose BDI-II " +
      "trajectory climbed into the moderate range also produced the worst PVT lapses and the most " +
      "MC conflict. Threshold ≥ 20 → specialist flag. Reversed: lower score → higher z.",
    instrument: "BDI-II total score 0–63, 21 items (Beck et al. 1996); reversed",
    scale: { min: 0, max: 63 },
    higherIsBetter: false,
    citations: ["10.1207/s15327752jpa6703_13"],
    minimumTier: "minimum",
    tierInstruments: {
      minimum: {
        instrument: "PHQ-9 (Patient Health Questionnaire, 9-item; free, public domain; Kroenke & Spitzer 2001)",
        citations: ["10.1046/j.1525-1497.2001.016009606.x"],
        scaleTransform: {
          multiplier: 2.33,
          note: "PHQ-9 native 0–27 → ×2.33 → BDI-II canonical 0–63 scale.",
        },
        notes: "Kroenke & Spitzer 2001; DOI flagged for manual verification.",
      },
      medium: {
        instrument: "BDI-II (Pearson; ~USD 2–5/protocol; paper-and-pencil)",
        citations: ["10.1207/s15327752jpa6703_13"],
      },
      elite: {
        instrument: "BDI-II serial administration (every 2–4 weeks pre-mission; trajectory slope is operative statistic)",
        citations: ["10.1207/s15327752jpa6703_13", "10.1371/journal.pone.0093298"],
      },
    },
  },
];
