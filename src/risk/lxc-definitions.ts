// NASA Human System Risk Board Likelihood × Consequence (LxC) framework
// ─────────────────────────────────────────────────────────────────────
// Source of truth: JSC-66705 Revision A "Human System Risk Management Plan"
// (Health and Medical Technical Authority, NASA Johnson Space Center, Oct
// 2020). Figure 4 on page 28 and Section 3.2.4 on page 27 give the verbatim
// scale definitions and matrix cell scores reproduced here.
//
// The archived developer adapter uses this framework to translate Monte Carlo
// summaries into an HSRB-inspired color for technical comparison only. It is
// not a NASA HSRB risk posture or board-equivalent verdict.
//
// IMPORTANT: This is the *Human System* matrix, not the general Agency
// risk matrix from NPR 8000.4C — the HSRB explicitly weights consequence
// higher than likelihood and uses the priority scores below rather than a
// symmetric L×C product. See JSC-66705 Rev A §3.2.4 page 27, last
// paragraph: "the consequence category is given slightly more weight
// than the likelihood category."

export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;
export type ConsequenceLevel = 1 | 2 | 3 | 4 | 5;
export type RiskColor = "green" | "yellow" | "red" | "gray";

// ─────────────────────────────────────────────────────────────────────
// 5×5 priority-score matrix (verbatim from JSC-66705 Rev A Figure 4, p. 28)
//   Rows: likelihood L = 1..5 (bottom to top in the figure; here indexed L=1 first)
//   Cols: consequence C = 1..5
// Consequence is weighted higher than likelihood — see L5-C3=20 (red) while
// L3-C5=21 (also red) but the asymmetry is visible at L4-C2=13 vs L2-C4=14.
// ─────────────────────────────────────────────────────────────────────
export const LXC_PRIORITY_SCORES: readonly (readonly number[])[] = [
  // C=1  C=2  C=3  C=4  C=5
  [   1,   3,   5,   8,  12 ], // L=1 (Very Low)
  [   2,   6,  11,  14,  17 ], // L=2 (Low)
  [   4,   9,  15,  19,  21 ], // L=3 (Moderate)
  [   7,  13,  18,  22,  24 ], // L=4 (High)
  [  10,  16,  20,  23,  25 ], // L=5 (Very High)
] as const;

// Color-zone rules — JSC-66705 Rev A §3.2.4 p. 27:
//   "the rule for assigning Risk Colors is: red (maximum LxC Score ≥ 20),
//    yellow (11 ≤ maximum LxC Score ≤ 19), and green (maximum LxC Score ≤ 10)."
export const COLOR_RED_MIN = 20;
export const COLOR_YELLOW_MIN = 11;
// (Green is everything ≤ 10.)

export function lxcScore(L: LikelihoodLevel, C: ConsequenceLevel): number {
  return LXC_PRIORITY_SCORES[L - 1][C - 1];
}

export function lxcColor(score: number): RiskColor {
  if (score >= COLOR_RED_MIN) return "red";
  if (score >= COLOR_YELLOW_MIN) return "yellow";
  return "green";
}

// ─────────────────────────────────────────────────────────────────────
// Likelihood scale — In-Mission impact category
// Verbatim quantitative thresholds from JSC-66705 Rev A Figure 4 p. 28,
// "LIKELIHOOD RATING · In-Mission" column.
// ─────────────────────────────────────────────────────────────────────
export type LikelihoodBand = {
  level: LikelihoodLevel;
  label: string;
  pLowExclusive: number;  // strictly greater than
  pHighInclusive: number; // less than or equal to
  definition: string;     // verbatim from JSC-66705 Fig. 4
};

export const LIKELIHOOD_BANDS_IN_MISSION: readonly LikelihoodBand[] = [
  {
    level: 1,
    label: "Very Low",
    pLowExclusive: -Infinity,
    pHighInclusive: 0.0001,
    definition:
      "Nearly certain to not occur in-mission or P ≤ 0.01%",
  },
  {
    level: 2,
    label: "Low",
    pLowExclusive: 0.0001,
    pHighInclusive: 0.001,
    definition:
      "Unlikely to happen during the mission or 0.01% < P ≤ 0.1%",
  },
  {
    level: 3,
    label: "Moderate",
    pLowExclusive: 0.001,
    pHighInclusive: 0.01,
    definition:
      "May happen during the mission or 0.1% < P ≤ 1%",
  },
  {
    level: 4,
    label: "High",
    pLowExclusive: 0.01,
    pHighInclusive: 0.10,
    definition:
      "Likelihood is high during the mission or 1% < P ≤ 10%",
  },
  {
    level: 5,
    label: "Very High",
    pLowExclusive: 0.10,
    pHighInclusive: Infinity,
    definition:
      "More likely to happen than not during the mission or probability (P) > 10%",
  },
] as const;

// ─────────────────────────────────────────────────────────────────────
// Consequence scale — In-Mission Mission Objectives Impact subcategory
// Verbatim from JSC-66705 Rev A Figure 4 p. 28, "CONSEQUENCES · IN MISSION
// · Mission Objectives Impact" row.
//
// Why this sub-category (not Crew Health Impact):
//   JSC-66705 §3.2.4 p. 29: "Only one Sub-Impact Category shall be used to
//   inform the LxC score for each Impact category."
//   Selectron's consequence axis is (1 − χ_mean) = QTL / (t · c) = fraction
//   of total crew-days lost to incapacitation. That is a mission-time-lost
//   rollup, not a per-crewmember clinical severity. The Mission Objectives
//   row ("Significant reduction in crew performance, threatens loss of a
//   mission objective" → "Loss of mission") aligns with the math; the Crew
//   Health row ("Temporary discomfort" → "Death or permanently disabling
//   injury/illness affecting one or more crewmember") aligns with per-event
//   clinical severity which CHI's aggregate QTL does not directly measure.
// ─────────────────────────────────────────────────────────────────────
export type ConsequenceBand = {
  level: ConsequenceLevel;
  label: string;
  // Selectron's quantitative bridge: fraction of total crew-days lost to
  // incapacitation. The JSC-66705 Mission Objectives descriptors are
  // qualitative; thresholds here are Selectron's interpretation aligned to
  // the operational meaning of each descriptor (e.g. "threatens loss of a
  // mission objective" ⇒ ~5–15% of mission time degraded).
  fractionLostLowExclusive: number;
  fractionLostHighInclusive: number;
  definition: string; // verbatim JSC-66705 Mission Objectives Impact descriptor
};

export const CONSEQUENCE_BANDS_MISSION_OBJ: readonly ConsequenceBand[] = [
  {
    level: 1,
    label: "Negligible",
    fractionLostLowExclusive: -Infinity,
    fractionLostHighInclusive: 0.01,
    definition:
      "Insignificant impact to crew performance and operations – no additional resources required",
  },
  {
    level: 2,
    label: "Minor",
    fractionLostLowExclusive: 0.01,
    fractionLostHighInclusive: 0.05,
    definition:
      "Minor impact to crew performance and operations – requires additional resources (time, consumables)",
  },
  {
    level: 3,
    label: "Significant",
    fractionLostLowExclusive: 0.05,
    fractionLostHighInclusive: 0.15,
    definition:
      "Significant reduction in crew performance, threatens loss of a mission objective",
  },
  {
    level: 4,
    label: "Severe",
    fractionLostLowExclusive: 0.15,
    fractionLostHighInclusive: 0.30,
    definition:
      "Severe reduction of crew performance that results in loss of multiple mission objectives",
  },
  {
    level: 5,
    label: "Loss of Mission",
    fractionLostLowExclusive: 0.30,
    fractionLostHighInclusive: Infinity,
    definition:
      "Loss of mission due to crew performance reductions or loss of crew",
  },
] as const;

// ─────────────────────────────────────────────────────────────────────
// Three risk-impact categories per JSC-66705 Rev A §3.2.3 p. 26.
// Selectron's CHI metric falls under "In-Mission" → "Crew Health Impact".
// ─────────────────────────────────────────────────────────────────────
export const RISK_IMPACT_CATEGORIES = {
  inMission: {
    label: "In-Mission Risk (Ops)",
    definition:
      "The Risk Posture for crews in-mission defined by successful launch until successful and safe egress from the landing vehicle.",
    subcategories: ["Crew Health Impact", "Mission Objectives Impact"],
  },
  flightRecert: {
    label: "Flight Recertification",
    definition:
      "Applies when specific risk manifestation impacts the crewmember's physical or mental health after a mission, thereby delaying their flight certification and flight recertification status.",
  },
  longTermHealth: {
    label: "Long Term Health (LTH)",
    definition:
      "The lifetime impact of spaceflight on physical and mental health and performance of astronauts post flight including post-career.",
    subcategories: ["Health Outcomes", "Quality of Life"],
  },
} as const;
