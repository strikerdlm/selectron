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
];
