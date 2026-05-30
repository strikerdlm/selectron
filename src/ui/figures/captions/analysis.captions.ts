// src/ui/figures/captions/analysis.captions.ts
import type { CaptionBlock } from "../FigureCaption";

const demoNote = (isDemo: boolean, n: number) =>
  isDemo
    ? `Synthetic demonstration cohort (N=${n}, seed 0xc0ffee) with an injected latent-factor covariance; not real candidate data.`
    : `Live candidate pool (N=${n}).`;

export const analysisCaptions = {
  parallel: ({ n, isDemo, k }: { n: number; isDemo: boolean; k: number }): CaptionBlock => ({
    figureId: "A1",
    oneLine: `Parallel-coordinates profile of ${n} candidates across ${k} selection criteria.`,
    methods: "Each polyline is one candidate; each vertical axis is one criterion on its native instrument scale. Line color encodes the total MCDA score (mean of min–max-normalized, orientation-corrected criterion scores; closed-form Dirichlet(1,…,1) weight mean = 1/K).",
    source: demoNote(isDemo, n),
    reproducibility: "Deterministic given the cohort; demo cohort is seeded (0xc0ffee).",
  }),
  bubble: ({ n, excluded, missionDays }: { n: number; excluded: number; missionDays: number }): CaptionBlock => ({
    figureId: "A2",
    oneLine: `${n} IMM conditions by incidence, severity, body system, and mission contribution.`,
    methods: `x = incidence (events/1000 person-years, log) from the calibrated priors; y = worst-case severity probability α/(α+β); color = body-system group; bubble area ∝ expected ${missionDays}-day mission contribution (expected events × cumulative treated impairment). ${excluded} per-event (Beta-Bernoulli, per-EVA/SPE) conditions are excluded from the rate axis.`,
    source: "src/data/imm-priors.json (34 tierA-nasa + 66 tierB-pymc) joined with src/imm/conditions.ts.",
    reproducibility: "Pure function of the committed priors + condition catalog.",
  }),
  splom: ({ n, isDemo, ids }: { n: number; isDemo: boolean; ids: string[] }): CaptionBlock => ({
    figureId: "A3",
    oneLine: `Scatterplot matrix of ${ids.length} representative criteria over ${n} candidates.`,
    methods: `Pairwise raw-score scatter for the criteria [${ids.join(", ")}]; diagonal labels the variable. Capped to ${ids.length} criteria for legibility — the full ${"12×12"} relationships appear in the correlation heatmap (A4).`,
    source: demoNote(isDemo, n),
    reproducibility: "Deterministic given the cohort.",
  }),
  correlation: ({ n, isDemo, k }: { n: number; isDemo: boolean; k: number }): CaptionBlock => ({
    figureId: "A4",
    oneLine: `Pearson correlation among all ${k} selection criteria.`,
    methods: "Cell = Pearson r between two criteria's raw scores across the cohort; diverging scale on [−1, 1].",
    source: demoNote(isDemo, n),
    reproducibility: "Deterministic given the cohort.",
  }),
  coupling: ({ k, families }: { k: number; families: number }): CaptionBlock => ({
    figureId: "A5",
    oneLine: `Vulnerability coupling: ${k} criteria × ${families} IMM condition families.`,
    methods: "Cell = Σ over conditions in that family that list the criterion in vulnerabilityCriteria of |family β| (FAMILY_BETA, psychiatric −0.4 → renal −0.15, default −0.2). Visualizes the Stage-A → λ modulation architecture (58/100 coupled conditions).",
    source: "src/imm/conditions.ts (vulnerabilityCriteria) + src/imm/simulate.ts (FAMILY_BETA).",
    reproducibility: "Pure function of the committed condition catalog + β map.",
  }),
};
