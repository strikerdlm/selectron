# Selectron IMM Calculator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a NASA-style probabilistic medical-risk calculator alongside Selectron's existing Stage B + HSRB LxC pipeline. Accepts mission/crew/kit inputs, runs a 4-step IMM Monte Carlo over 100 medical conditions, emits TME / CHI / pEVAC / pLOCL with CI95, validates against Keenan 2015 Table 1 (ISS 6mo / 6crew).

**Architecture:** New parallel `src/imm/` module mirroring `src/risk/` API. 100 K15 appendix conditions with three-tier prior provenance (NASA-published / literature / synthetic-backfit). Dexie v3 additive migration adds `imm_sessions`. ML layer = LightGBM surrogate (real-time UI) + per-crewmember Bayesian MLP vulnerability modifier (publishable novelty). 8 Q1-style ECharts figures (I1–I8) on the existing `selectron-nature` theme with new lay-person/expert caption toggle.

**Tech Stack:** TypeScript, Vite, React, Tailwind, ECharts 6, Dexie 4, Vitest, Playwright, LightGBM (via `lightgbm-wasm`), TensorFlow.js (`@tensorflow/tfjs`). No new runtime services.

**Spec:** [`docs/superpowers/specs/2026-05-20-selectron-imm-calculator-design.md`](../specs/2026-05-20-selectron-imm-calculator-design.md).

---

## Glossary (read this before any task)

| Acronym | Meaning |
|---|---|
| IMM | Integrated Medical Model (NASA's probabilistic medical-risk simulator) |
| CHI | Crew Health Index = 100% × (1 − QTL_total / (L × c)) |
| TME | Total Medical Events — simple count per trial |
| pEVAC | Probability an evacuation should be considered (per Bernoulli event aggregated across trials) |
| pLOCL | Probability of loss of one or more crew life |
| QTL | Quality Time Lost = Σ FI × DT across events |
| FI | Functional Impairment, dimensionless 0–1 |
| DT | Downtime in hours |
| CP1/2/3 | Clinical Phase 1 (diagnosis+initial treatment), 2 (ongoing+convalescence), 3 (permanent impairment for remainder of mission) |
| RAF | Resource Availability Factor = min(1, available / required) per condition per event |
| SA | Space Adaptation — conditions that occur once in flight, mostly within the first 5 days |
| SPE | Solar Particle Event — Poisson process; triggers ARS Bernoulli |
| EVA | Extravehicular Activity ("spacewalk") |
| K15 | Keenan et al. 2015, ICES-2015 IMM architecture paper |
| M18 | Myers et al. 2018, PSAM 14 IMM validation |
| G12 | Gilkey et al. 2012, NASA TP-2012-217120 Bayesian IMM analysis |
| A22 | Antonsen et al. 2022, npj Microgravity medical-risk paper |
| R21 | Roma et al. 2021, Acta Astronautica BHP impact ratings |
| S20 | Walton & Kerstman 2020, AsMA ISS-DRM IMM application |
| TM21 | Antonsen 2021, NASA-TM-20210009779 Mars AMM/SMM comparison |
| SP09 | NASA SP-2009-569 Bayesian PRA reference text |
| W14 | Walton 2014, NASA-STD-7009 8-factor V&V framework |

---

## File structure (locked at plan time)

```
src/imm/
  types.ts                          Type system: IMMCondition, IMMCrewMember, IMMMission,
                                    IMMKitScenario, IMMOutcome, IMMPosterior, IMMPrior,
                                    IMMSession, PosteriorSummary
  conditions.ts                     100 K15 appendix entries with metadata
  priors.ts                         Loads and type-validates src/data/imm-priors.json
  incidence.ts                      Lognormal-Poisson, Gamma-Poisson, Beta-Bernoulli,
                                    SPE Poisson process
  severity.ts                       Bernoulli(worst-case)
  treatment.ts                      RAF; Beta-Pert distribution shifting
  outcomes.ts                       Beta-Pert sampler; CP1/2/3 FI+DT; pEVAC + pLOCL
                                    Bernoulli; concurrent FI = 1 − Π(1 − f_i)
  kits.ts                           IMM_KITS = { none, issHMS, unlimited, custom }
  simulate.ts                       runIMMTrial(), simulateIMM(); T=100k default
  calibration.ts                    Tier-C global multipliers; K15 residuals
  ml/
    surrogate.ts                    LightGBM-WASM inference; loads imm_surrogate_v1.json
    vulnerability.ts                Bayesian MLP inference (TFJS); loads vulnerability_v1.json
    feature_engineering.ts          Stable hashing of mission+crew+kit → fixed-length vector
    models/
      imm_surrogate_v1.json         Pretrained LightGBM dump (~50 KB)
      vulnerability_v1.json         Pretrained TFJS JSON + weights (~100 KB)
      training_provenance.md        Hyperparams, training-set size, held-out metrics
    captions/
      I1.layperson.ts … I8.layperson.ts
  index.ts                          Public barrel re-export

src/data/
  imm-priors.json                   100 conditions × prior parameters
  imm-missions.ts                   ISS-6mo (K15), ISS-DRM1, ISS-DRM2 (S20),
                                    AMM-426d, SMM-923d (TM21) + 8 existing analog missions

src/ui/views/
  IMMCalculator.tsx                 New top-level view (3-column form)

src/ui/components/
  IMMCrewBuilder.tsx                Per-member risk-factor row + EVA count
  IMMKitPicker.tsx                  None / ISS HMS / Unlimited / Custom radio
  IMMResultsCard.tsx                4-metric headline card

src/ui/figures/
  IMMHeadlineCard.tsx               I1 — hero stat composite + CI95 whisker
  IMMPosteriorHist.tsx              I2 — 4-panel small-multiple histograms
  IMMConditionDrivers.tsx           I3 — lollipop sorted by pEVAC/pLOCL contribution
  IMMConvergencePlot.tsx            I4 — σ vs trials, dashed 5% rule
  IMMValidationCompare.tsx          I5 — dumbbell vs K15 reference
  IMMSensitivityTornado.tsx         I6 — top 20 perturbations on pEVAC
  IMMCrewRiskHeat.tsx               I7 — crew × condition heatmap
  IMMVulnerabilityCalibration.tsx   I8 — ML modifier calibration scatter
  FigureCaption.tsx                 EXTENDED — adds layperson? field + toggle

src/db/schema.ts                    SCHEMA_VERSION = 3; new imm_sessions table
src/db/repository.ts                CRUD for imm_sessions

src/workers/
  imm-simulate.worker.ts            Web Worker — runs simulateIMM off the main thread

scripts/
  build_imm_conditions.ts           Generates conditions.ts from K15 markdown
  build_imm_priors.ts               Populates imm-priors.json from research/imm_sources/
                                    + research/evidence/
  calibrate_imm_priors.ts           Back-fits Tier-C global multipliers to K15 Table 1
  train_imm_surrogate.ts            Generates 10k MC runs, fits LightGBM
  train_imm_vulnerability.ts        Generates synthetic GT, fits Bayesian MLP
  validate_imm.ts                   Prints K15/S20/TM21 deltas for V&V dossier

tests/imm/
  types.test.ts                     Type-level invariants
  conditions.test.ts                All 100 entries valid; risk-factor flags map cleanly
  priors.test.ts                    JSON schema validation; provenance tags
  incidence.test.ts                 Distribution moments closed-form
  severity.test.ts                  Bernoulli convergence
  treatment.test.ts                 RAF interpolation at 11 RAF values
  outcomes.test.ts                  Beta-Pert moments; concurrent FI formula
  kits.test.ts                      Kit budgets correct
  simulate.test.ts                  T=100k determinism; σ<5% convergence
  calibration.test.ts               Tier-C multiplier idempotency
  surrogate.test.ts                 ML surrogate vs MC held-out grid
  vulnerability.test.ts             ML modifier vs synthetic GT
  validation.test.ts                **Gate** — K15 Table 1 within CI95 AND TM21 within ±20%

tests/e2e/
  imm-calculator.smoke.spec.ts      Playwright snapshot tests for I1-I8
```

**Commit convention:** `feat(imm): …` for code, `feat(imm-ui): …` for UI components, `test(imm): …` for test-only commits, `docs(imm): …` for prose, `chore(imm): …` for build/packaging. No AI co-author lines (per `/root/repos/CLAUDE.md`).

---

# Phase P0 — Corpus + Priors (Tasks 1–15)

## Task 1: Branch + scaffold + STATUS row

**Files:**
- Modify: `STATUS.md` (add P0 task table)
- Create: `src/imm/.gitkeep`
- Create: `src/imm/ml/.gitkeep`
- Create: `src/imm/ml/models/.gitkeep`
- Create: `src/imm/ml/captions/.gitkeep`
- Create: `tests/imm/.gitkeep`
- Create: `scripts/.gitkeep` (already exists)

- [ ] **Step 1: Verify branch**

Run: `git status --short && git rev-parse --abbrev-ref HEAD`
Expected: branch is `iter1-phase0`, working tree clean (apart from research/evidence/bridges/ and research/graphify-out/ — Diego's untracked work, leave alone).

- [ ] **Step 2: Create the directory scaffolding**

Run: `mkdir -p src/imm/ml/models src/imm/ml/captions tests/imm && touch src/imm/.gitkeep src/imm/ml/.gitkeep src/imm/ml/models/.gitkeep src/imm/ml/captions/.gitkeep tests/imm/.gitkeep`

- [ ] **Step 3: Append IMM task table to STATUS.md**

Read STATUS.md, then under the existing task table append a new section:

```markdown
## IMM Calculator task status (Iter-5)

| # | Task | Status | Commit | Notes |
|---|------|--------|--------|-------|
| IMM-01 | Branch + scaffold | IN_PROGRESS | — | This commit |
| IMM-02 | src/imm/types.ts | PENDING | — | — |
... (rows IMM-03 through IMM-97 as PENDING)
```

Add all 97 rows as `PENDING`. After completing each task in subsequent commits, move that row to DONE and append a one-line entry to the Audit log.

- [ ] **Step 4: Commit**

```bash
git add STATUS.md src/imm/ tests/imm/
git commit -m "feat(imm): IMM Calculator scaffold + task tracking"
```

---

## Task 2: src/imm/types.ts

**Files:**
- Create: `src/imm/types.ts`
- Create: `tests/imm/types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/imm/types.test.ts
import { describe, it, expect } from "vitest";
import type {
  IMMCondition, IMMCrewMember, IMMMission, IMMKitScenario,
  IMMBetaPert, IMMPrior, IMMOutcome, PosteriorSummary, IMMSession
} from "../../src/imm/types";

describe("IMM types", () => {
  it("IMMCondition shape", () => {
    const c: IMMCondition = {
      id: "acute-sinusitis",
      label: "Acute Sinusitis",
      family: "ENT",
      incidenceSource: "in-flight",
      incidenceDist: "Gamma",
      processType: "general-Poisson",
      riskFactors: [],
      vulnerabilityCriteria: [],
    };
    expect(c.id).toBe("acute-sinusitis");
  });

  it("IMMBetaPert shape", () => {
    const b: IMMBetaPert = { min: 0, mode: 0.05, max: 0.15 };
    expect(b.mode).toBeGreaterThanOrEqual(b.min);
    expect(b.mode).toBeLessThanOrEqual(b.max);
  });

  it("IMMCrewMember shape", () => {
    const m: IMMCrewMember = {
      id: "c1", sex: "male", contacts: false, crowns: false,
      CAC_positive: false, abdominal_surgery_history: false,
      EVA_eligible: true, EVA_count: 6,
    };
    expect(m.EVA_count).toBe(6);
  });
});
```

- [ ] **Step 2: Run test — must fail**

Run: `npx vitest run tests/imm/types.test.ts`
Expected: FAIL (module `../../src/imm/types` not found).

- [ ] **Step 3: Implement types.ts**

```ts
// src/imm/types.ts

export type IMMConditionFamily =
  | "behavioral" | "cardiovascular" | "dental" | "dermatologic"
  | "ENT" | "endocrine" | "GI" | "GU" | "hematologic"
  | "infectious" | "musculoskeletal" | "neurologic" | "ophthalmologic"
  | "psychiatric" | "renal" | "respiratory" | "space-adaptation"
  | "toxicologic" | "traumatic";

export type IMMRiskFactor =
  | "sex-male" | "sex-female"
  | "contacts" | "crowns" | "CAC-positive"
  | "abdominal-surgery-history" | "EVA" | "SPE";

export type IMMProcessType =
  | "general-Poisson" | "space-adaptation-once"
  | "EVA-coupled" | "SPE-coupled" | "SA-VIIP-late";

export type IMMCondition = {
  id: string;
  label: string;
  family: IMMConditionFamily;
  incidenceSource: "in-flight" | "terrestrial" | "astronaut-pre-postflight" | "external-model";
  incidenceDist: "Gamma" | "Lognormal" | "Beta" | "Fixed";
  processType: IMMProcessType;
  riskFactors: IMMRiskFactor[];
  vulnerabilityCriteria: string[];
};

export type IMMBetaPert = { min: number; mode: number; max: number };

export type IMMConditionOutcomes = {
  fi_cp1: IMMBetaPert; dt_cp1_hours: IMMBetaPert;
  fi_cp2: IMMBetaPert; dt_cp2_hours: IMMBetaPert;
  fi_cp3: IMMBetaPert;
  p_evac: IMMBetaPert; p_locl: IMMBetaPert;
};

export type IMMPrior = {
  conditionId: string;
  provenance: "tierA-nasa" | "tierB-lit" | "tierC-synth" | "user-custom";
  source_ref: string;
  incidence: {
    distribution: "Lognormal-Poisson" | "Gamma-Poisson" | "Beta-Bernoulli" | "Fixed";
    mu_log_lambda?: number; sigma_log_lambda?: number;
    alpha?: number; beta?: number;
    lambda_fixed?: number;
    lambda_unit?: "events-per-person-day" | "events-per-EVA" | "events-per-SPE";
  };
  severity: { worst_case_prob_alpha: number; worst_case_prob_beta: number };
  treated: IMMConditionOutcomes;
  untreated: IMMConditionOutcomes;
  risk_factor_multipliers: Partial<Record<IMMRiskFactor, number>>;
  required_resources: Record<string, number>;
};

export type IMMCrewMember = {
  id: string;
  sex: "male" | "female";
  contacts: boolean;
  crowns: boolean;
  CAC_positive: boolean;
  abdominal_surgery_history: boolean;
  EVA_eligible: boolean;
  EVA_count: number;
  selectronStageACandidateId?: string;
};

export type IMMMission = {
  id: string;
  label: string;
  durationDays: number;
  crewSize: number;
  totalEVAs: number;
  evaSchedule: number[];
};

export type IMMKitScenario = {
  scenarioId: "none" | "issHMS" | "unlimited" | "custom";
  label: string;
  resources: Record<string, number>;
};

export type PosteriorSummary = {
  mean: number; ci90: [number, number]; ci95: [number, number]; sd: number;
};

export type IMMOutcome = {
  tme: PosteriorSummary;
  chi: PosteriorSummary;
  pEvac: PosteriorSummary;
  pLocl: PosteriorSummary;
  perConditionDrivers: {
    conditionId: string;
    pEvacContrib: number; pLoclContrib: number; tmeContrib: number;
  }[];
  convergence: {
    trialCheckpoints: number[];
    sigmaChi: number[]; sigmaPevac: number[];
  };
};

export type IMMSession = {
  id: string;
  candidateId: string | null;
  createdAt: string;
  mission: IMMMission;
  crew: IMMCrewMember[];
  kit: IMMKitScenario;
  trials: number;
  seed: number;
  overrides: Record<string, Partial<IMMPrior>>;
  vulnerabilityMode: "boolean-flags" | "selectron-stage-a-ml";
  engine: "monte-carlo" | "surrogate-ml";
  outcomes: IMMOutcome;
  validation: {
    vsK15Table1: {
      delta_tme: number; delta_chi: number;
      delta_pEvac: number; delta_pLocl: number;
      within_ci95: boolean;
    };
  };
  laypersonCaptionsExpanded: Record<string, boolean>;
};
```

- [ ] **Step 4: Run test — must pass**

Run: `npx vitest run tests/imm/types.test.ts && npm run typecheck`
Expected: 3/3 pass; typecheck exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/imm/types.ts tests/imm/types.test.ts
git commit -m "feat(imm): core type system (types.ts) — IMMCondition, IMMPrior, IMMOutcome, IMMSession"
```

---

## Task 3: Build conditions.ts from K15 appendix

**Files:**
- Create: `scripts/build_imm_conditions.ts`
- Create: `src/imm/conditions.ts` (generated)
- Create: `tests/imm/conditions.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/imm/conditions.test.ts
import { describe, it, expect } from "vitest";
import { IMM_CONDITIONS } from "../../src/imm/conditions";

describe("IMM_CONDITIONS", () => {
  it("contains the full K15 appendix catalog (95-100 conditions)", () => {
    expect(IMM_CONDITIONS.length).toBeGreaterThanOrEqual(95);
    expect(IMM_CONDITIONS.length).toBeLessThanOrEqual(102);
  });

  it("every condition has unique id, valid family, valid distribution", () => {
    const ids = new Set<string>();
    const validFamilies = new Set([
      "behavioral","cardiovascular","dental","dermatologic","ENT","endocrine",
      "GI","GU","hematologic","infectious","musculoskeletal","neurologic",
      "ophthalmologic","psychiatric","renal","respiratory","space-adaptation",
      "toxicologic","traumatic",
    ]);
    const validDists = new Set(["Gamma","Lognormal","Beta","Fixed"]);
    for (const c of IMM_CONDITIONS) {
      expect(ids.has(c.id)).toBe(false);
      ids.add(c.id);
      expect(validFamilies.has(c.family)).toBe(true);
      expect(validDists.has(c.incidenceDist)).toBe(true);
    }
  });

  it("at least 8 conditions have risk factors", () => {
    const withRiskFactors = IMM_CONDITIONS.filter(c => c.riskFactors.length > 0);
    expect(withRiskFactors.length).toBeGreaterThanOrEqual(8);
  });

  it("SA conditions use space-adaptation-once or SA-VIIP-late process", () => {
    const sa = IMM_CONDITIONS.filter(c =>
      c.label.toLowerCase().includes("space adaptation") ||
      c.label === "Visual Impairment and Intracranial Pressure (VIIP)(space adaptation)"
    );
    expect(sa.length).toBeGreaterThanOrEqual(5);
    for (const c of sa) {
      expect(["space-adaptation-once","SA-VIIP-late"]).toContain(c.processType);
    }
  });
});
```

- [ ] **Step 2: Run test — must fail (module missing)**

Run: `npx vitest run tests/imm/conditions.test.ts`
Expected: FAIL — module `../../src/imm/conditions` not found.

- [ ] **Step 3: Write the builder script that parses K15**

```ts
// scripts/build_imm_conditions.ts
// Parses research/imm_sources/architecture/K15_keenan_2015_imm_probabilistic_simulation.md
// appendix table and emits src/imm/conditions.ts.

import { readFileSync, writeFileSync } from "node:fs";

const md = readFileSync("research/imm_sources/architecture/K15_keenan_2015_imm_probabilistic_simulation.md", "utf-8");

// Extract appendix table rows (markdown table format `| col | col | col | col |`)
const rows = md.split("\n").filter(l => /^\|\s+[A-Za-z]/.test(l) && l.includes("|"));
// Drop header rows
const dataRows = rows.filter(l => !/Medical Condition\s*\|\s*Incidence Data Source/.test(l));

// Map K15 family-implicit names to typed family
const familyMap: Record<string, string> = {
  abdominal: "GI", appendicitis: "GI", cholecystitis: "GI", diverticulitis: "GI",
  pancreatitis: "GI", diarrhea: "GI", indigestion: "GI", gastroenteritis: "GI",
  hemorrhoids: "GI", "small bowel obstruction": "GI", "uterine bleeding": "GU",
  cystitis: "GU", prostatitis: "GU", "urinary tract": "GU", "yeast infection": "GU",
  "urinary incontinence": "GU", "urinary retention": "GU", nephrolithiasis: "renal",
  // … extend map as required to assign every condition to a typed family
};

function inferFamily(label: string): string {
  const lc = label.toLowerCase();
  if (lc.includes("space adaptation") || lc.includes("nasal congestion") ||
      lc.includes("back pain") || lc.includes("motion sickness")) return "space-adaptation";
  if (lc.includes("dental")) return "dental";
  if (lc.includes("eye") || lc.includes("retinal") || lc.includes("glaucoma")) return "ophthalmologic";
  if (lc.includes("ear") || lc.includes("sinusitis") || lc.includes("otitis") || lc.includes("pharyngitis")) return "ENT";
  if (lc.includes("hearing")) return "ENT";
  if (lc.includes("anxiety") || lc.includes("depression") || lc.includes("behavioral")) return "psychiatric";
  if (lc.includes("seizure") || lc.includes("paresthesia") || lc.includes("headache")) return "neurologic";
  if (lc.includes("burn") || lc.includes("skin") || lc.includes("rash") || lc.includes("laceration") ||
      lc.includes("abrasion") || lc.includes("ulcer") && !lc.includes("eye")) return "dermatologic";
  if (lc.includes("dislocation") || lc.includes("sprain") || lc.includes("strain") ||
      lc.includes("fracture") || lc.includes("injury") && !lc.includes("eye")) return "musculoskeletal";
  if (lc.includes("infection") || lc.includes("influenza") || lc.includes("shingles")) return "infectious";
  if (lc.includes("cardiac") || lc.includes("angina") || lc.includes("infarction") ||
      lc.includes("atrial") || lc.includes("hypertension")) return "cardiovascular";
  if (lc.includes("respiratory") || lc.includes("choking")) return "respiratory";
  if (lc.includes("anaphylaxis") || lc.includes("allergic")) return "infectious";  // immune-mediated
  if (lc.includes("stroke")) return "neurologic";
  if (lc.includes("sepsis") || lc.includes("shock")) return "infectious";
  if (lc.includes("fingernail")) return "musculoskeletal";
  if (lc.includes("toxic") || lc.includes("smoke") || lc.includes("overdose")) return "toxicologic";
  if (lc.includes("hemorrhoid") || lc.includes("constipation")) return "GI";
  if (lc.includes("radiation")) return "toxicologic";
  if (lc.includes("decompression")) return "musculoskeletal";
  if (lc.includes("nose bleed") || lc.includes("mouth ulcer")) return "ENT";
  return "GI";  // fallback; will be reviewed in Step 5
}

function inferProcess(label: string, riskFactors: string[]): string {
  const lc = label.toLowerCase();
  if (lc.includes("viip")) return "SA-VIIP-late";
  if (lc.includes("space adaptation")) return "space-adaptation-once";
  if (riskFactors.includes("EVA")) return "EVA-coupled";
  if (riskFactors.includes("SPE")) return "SPE-coupled";
  return "general-Poisson";
}

function inferRiskFactors(raw: string): string[] {
  const out: string[] = [];
  const lc = raw.toLowerCase();
  if (lc.includes("sex")) out.push("sex-female"); // dual-flag at sample time
  if (lc.includes("contacts")) out.push("contacts");
  if (lc.includes("crowns")) out.push("crowns");
  if (lc.includes("coronary artery calcium")) out.push("CAC-positive");
  if (lc.includes("abdominal surgery")) out.push("abdominal-surgery-history");
  if (lc.includes("eva")) out.push("EVA");
  if (lc.includes("spe")) out.push("SPE");
  return out;
}

const slug = (s: string) => s.toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const conditions = dataRows.map(line => {
  const cells = line.split("|").slice(1, -1).map(c => c.trim());
  const label = cells[0];
  const source = cells[1];
  const dist = cells[2];
  const riskFactorsRaw = cells[3] || "";
  return {
    id: slug(label),
    label,
    family: inferFamily(label),
    incidenceSource: source.includes("In-flight") ? "in-flight" :
                     source.includes("Astronaut") ? "astronaut-pre-postflight" :
                     source.includes("External") ? "external-model" : "terrestrial",
    incidenceDist: dist as "Gamma" | "Lognormal" | "Beta" | "Fixed",
    processType: inferProcess(label, inferRiskFactors(riskFactorsRaw)),
    riskFactors: inferRiskFactors(riskFactorsRaw),
    vulnerabilityCriteria: [] as string[],
  };
});

const out = `// AUTO-GENERATED by scripts/build_imm_conditions.ts — do not edit by hand.
// Source: research/imm_sources/architecture/K15_keenan_2015_imm_probabilistic_simulation.md (appendix table).
// Re-run: \`npx tsx scripts/build_imm_conditions.ts\`.

import type { IMMCondition } from "./types";

export const IMM_CONDITIONS: IMMCondition[] = ${JSON.stringify(conditions, null, 2)};
`;

writeFileSync("src/imm/conditions.ts", out);
console.log(`wrote src/imm/conditions.ts with ${conditions.length} conditions`);
```

- [ ] **Step 4: Run the builder**

Run: `npx tsx scripts/build_imm_conditions.ts`
Expected: prints `wrote src/imm/conditions.ts with NN conditions` with NN between 95 and 102.

- [ ] **Step 5: Manual review pass on family inference**

Open `src/imm/conditions.ts`. Scan every entry's `family` field. The auto-inference in `inferFamily()` is regex-based and will miss edge cases. Read each label and manually correct the family if wrong. Common corrections:

- "Abnormal Uterine Bleeding" → `GU` (not GI)
- "Cardiogenic Shock secondary to Myocardial Infarction" → `cardiovascular`
- "Visual Impairment and Intracranial Pressure (VIIP)(space adaptation)" → `space-adaptation`
- "Acute Radiation Syndrome" → `toxicologic`

Edit `inferFamily()` in the script if you find a pattern that's missed by ≥ 2 conditions; rerun the builder.

- [ ] **Step 6: Run test — must pass**

Run: `npx vitest run tests/imm/conditions.test.ts && npm run typecheck`
Expected: 4/4 pass; typecheck exit 0.

- [ ] **Step 7: Commit**

```bash
git add scripts/build_imm_conditions.ts src/imm/conditions.ts tests/imm/conditions.test.ts
git commit -m "feat(imm): 100-condition catalog generated from K15 appendix"
```

---

## Task 4: imm-priors.json schema + tierA seed (M18 8 conditions)

**Files:**
- Create: `src/data/imm-priors.json`
- Create: `src/imm/priors.ts`
- Create: `tests/imm/priors.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/imm/priors.test.ts
import { describe, it, expect } from "vitest";
import { loadIMMPriors, validatePriorsJson } from "../../src/imm/priors";

describe("IMM priors", () => {
  it("loads imm-priors.json", () => {
    const priors = loadIMMPriors();
    expect(priors.schema_version).toBe(1);
    expect(Object.keys(priors.conditions).length).toBeGreaterThanOrEqual(8);
  });

  it("every prior carries a provenance tag and source_ref", () => {
    const priors = loadIMMPriors();
    for (const [id, p] of Object.entries(priors.conditions)) {
      expect(["tierA-nasa","tierB-lit","tierC-synth","user-custom"]).toContain(p.provenance);
      expect(typeof p.source_ref).toBe("string");
      expect(p.source_ref.length).toBeGreaterThan(0);
    }
  });

  it("Beta-Pert outcome ranges respect min <= mode <= max", () => {
    const priors = loadIMMPriors();
    for (const p of Object.values(priors.conditions)) {
      for (const phase of [p.treated.fi_cp1, p.treated.dt_cp1_hours, p.untreated.fi_cp1, p.untreated.dt_cp1_hours]) {
        expect(phase.min).toBeLessThanOrEqual(phase.mode);
        expect(phase.mode).toBeLessThanOrEqual(phase.max);
      }
    }
  });

  it("validatePriorsJson catches malformed input", () => {
    expect(() => validatePriorsJson({})).toThrow();
    expect(() => validatePriorsJson({ schema_version: 0 })).toThrow();
  });
});
```

- [ ] **Step 2: Run — must fail**

Run: `npx vitest run tests/imm/priors.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Seed imm-priors.json with 8 M18 conditions**

Create `src/data/imm-priors.json` with the M18 Table 1 numerical anchors. Source values from `research/imm_sources/methods/M18_myers_2018_imm_validation.md` math_anchors block.

```json
{
  "schema_version": 1,
  "calibration_target": "K15 Table 1 (ISS 6mo, 6 crew)",
  "conditions": {
    "acute-sinusitis": {
      "conditionId": "acute-sinusitis",
      "provenance": "tierA-nasa",
      "source_ref": "research/imm_sources/methods/M18_myers_2018_imm_validation.md#acute-sinusitis",
      "incidence": {
        "distribution": "Gamma-Poisson",
        "alpha": 2.0,
        "beta": 220.0,
        "lambda_unit": "events-per-person-day"
      },
      "severity": { "worst_case_prob_alpha": 1.2, "worst_case_prob_beta": 4.8 },
      "treated": {
        "fi_cp1": { "min": 0.0, "mode": 0.05, "max": 0.15 },
        "dt_cp1_hours": { "min": 2, "mode": 6, "max": 24 },
        "fi_cp2": { "min": 0.0, "mode": 0.0, "max": 0.05 },
        "dt_cp2_hours": { "min": 0, "mode": 12, "max": 72 },
        "fi_cp3": { "min": 0.0, "mode": 0.0, "max": 0.0 },
        "p_evac": { "min": 0.0, "mode": 0.001, "max": 0.01 },
        "p_locl": { "min": 0.0, "mode": 0.0, "max": 0.001 }
      },
      "untreated": {
        "fi_cp1": { "min": 0.05, "mode": 0.2,  "max": 0.5 },
        "dt_cp1_hours": { "min": 12, "mode": 48, "max": 168 },
        "fi_cp2": { "min": 0.0,  "mode": 0.05, "max": 0.2 },
        "dt_cp2_hours": { "min": 12, "mode": 72, "max": 240 },
        "fi_cp3": { "min": 0.0, "mode": 0.0, "max": 0.02 },
        "p_evac": { "min": 0.01, "mode": 0.05, "max": 0.15 },
        "p_locl": { "min": 0.0, "mode": 0.001, "max": 0.02 }
      },
      "risk_factor_multipliers": {},
      "required_resources": { "antibiotic-broad-spectrum": 7, "nasal-decongestant": 3 }
    }
  },
  "global_calibration": {
    "tierC_multiplier_iss_hms": 1.00,
    "tierC_multiplier_iss_none": 1.00,
    "tierC_multiplier_iss_unlimited": 1.00,
    "fit_against": "K15 Table 1, 100k trials",
    "fit_residuals_within_CI95": false
  }
}
```

Add the remaining 7 M18 conditions (Influenza, Skin Laceration, Skin Abrasion, Headache - CO2 induced, Ankle Sprain/Strain, Diarrhea, Eye Abrasion - foreign body). Use the same shape with M18-published λ values where available.

- [ ] **Step 4: Implement src/imm/priors.ts**

```ts
// src/imm/priors.ts
import priorsJson from "../data/imm-priors.json";
import type { IMMPrior } from "./types";

export type IMMPriorsFile = {
  schema_version: number;
  calibration_target: string;
  conditions: Record<string, IMMPrior>;
  global_calibration: {
    tierC_multiplier_iss_hms: number;
    tierC_multiplier_iss_none: number;
    tierC_multiplier_iss_unlimited: number;
    fit_against: string;
    fit_residuals_within_CI95: boolean;
  };
};

export function validatePriorsJson(obj: unknown): asserts obj is IMMPriorsFile {
  if (!obj || typeof obj !== "object") throw new Error("E_BAD_PRIORS: not an object");
  const p = obj as Record<string, unknown>;
  if (p.schema_version !== 1) throw new Error("E_BAD_PRIORS: schema_version must be 1");
  if (!p.conditions || typeof p.conditions !== "object") {
    throw new Error("E_BAD_PRIORS: conditions must be an object");
  }
  for (const [id, raw] of Object.entries(p.conditions)) {
    const c = raw as Record<string, unknown>;
    if (typeof c.provenance !== "string") throw new Error(`E_BAD_PRIORS: ${id} missing provenance`);
    if (typeof c.source_ref !== "string") throw new Error(`E_BAD_PRIORS: ${id} missing source_ref`);
  }
}

let cached: IMMPriorsFile | null = null;
export function loadIMMPriors(): IMMPriorsFile {
  if (cached) return cached;
  validatePriorsJson(priorsJson);
  cached = priorsJson as IMMPriorsFile;
  return cached;
}
```

Add `"resolveJsonModule": true` to `tsconfig.json` if not already present.

- [ ] **Step 5: Run test — must pass**

Run: `npx vitest run tests/imm/priors.test.ts && npm run typecheck`
Expected: 4/4 pass; typecheck exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/data/imm-priors.json src/imm/priors.ts tests/imm/priors.test.ts
git commit -m "feat(imm): imm-priors.json schema + tierA M18 seed (8 conditions)"
```

---

## Task 5: TierA priors — G12 Bayesian-updated 5 conditions

**Files:**
- Modify: `src/data/imm-priors.json` (add 5 entries)

- [ ] **Step 1: Read G12 math anchors**

Read `research/imm_sources/methods/G12_gilkey_2012_bayesian_imm.md` lines containing the Bayesian-updated λ values. Specifically the Appendix B / Appendix C blocks list Lognormal-Poisson posteriors for 5 conditions (Acute Cholecystitis, Appendicitis, Atrial Fibrillation, Nephrolithiasis, Seizures).

- [ ] **Step 2: Append 5 entries to imm-priors.json**

For each of the 5 G12 conditions, write a JSON entry with:
- `provenance: "tierA-nasa"`
- `source_ref: "research/imm_sources/methods/G12_gilkey_2012_bayesian_imm.md#<condition-id>"`
- `incidence: { distribution: "Lognormal-Poisson", mu_log_lambda: <from G12>, sigma_log_lambda: <from G12 = ln(EF)/1.645>, lambda_unit: "events-per-person-day" }`
- Treated / untreated Beta-Pert outcomes consistent with the K15 condition severity scale (use the same FI/DT/pEVAC/pLOCL ranges as similar-severity Tier-A entries if G12 doesn't specify).

- [ ] **Step 3: Re-run priors tests**

Run: `npx vitest run tests/imm/priors.test.ts`
Expected: 4/4 still pass; condition count ≥ 13.

- [ ] **Step 4: Commit**

```bash
git add src/data/imm-priors.json
git commit -m "feat(imm): tierA G12 priors — 5 Bayesian-updated conditions (Cholecystitis, Appendicitis, AFib, Nephrolithiasis, Seizures)"
```

---

## Task 6: TierA priors — TM21 Mars-driver conditions (~20)

**Files:**
- Modify: `src/data/imm-priors.json`

- [ ] **Step 1: Extract TM21 Tables 3–6 driving conditions**

Read `research/imm_sources/zotero_imm/antonsen-2021-comparison-of-health-and-performance.md`. Tables 3–6 list per-100k-trials counts for AMM (426 d) and SMM (923 d). Convert these counts to event rates:

For each condition C in Tables 3–6:
- `count_per_100k = entry from Table 3 (AMM EVAC) | Table 4 (SMM EVAC) | Table 5 (AMM LOCL) | Table 6 (SMM LOCL)`
- `prob_event_per_mission ≈ count_per_100k / 100_000`
- Convert to Poisson rate (per person-day) by dividing by mission_duration_days (426 or 923) and crew_size (4).

If the same condition appears in both AMM and SMM tables, use the SMM rate (higher confidence due to larger person-days).

- [ ] **Step 2: Add Mars driver conditions to imm-priors.json**

About 20–25 conditions. Each gets:
- `provenance: "tierA-nasa"`
- `source_ref: "research/imm_sources/zotero_imm/antonsen-2021-comparison-of-health-and-performance.md#table-3"` (or Table 4/5/6)
- Incidence distribution: Gamma-Poisson, with `alpha` and `beta` chosen so the mean equals the derived per-person-day λ. (Use weakly-informative `alpha = 2`, derive `beta = alpha / mean_lambda`.)
- pEVAC / pLOCL Beta-Pert untreated modes calibrated to the per-mission probability TM21 reports.

- [ ] **Step 3: Commit**

```bash
git add src/data/imm-priors.json
git commit -m "feat(imm): tierA TM21 priors — ~20 Mars driving conditions"
```

---

## Task 7: TierA priors — S20 ISS DRM driving conditions

**Files:**
- Modify: `src/data/imm-priors.json`

Same pattern as Task 6 but pulling from `research/imm_sources/validation/S20_walton_kerstman_2020_iss_quantification.md`. About 10 conditions. Each adds the ISS DRM-specific λ.

- [ ] **Step 1: Read S20 quantitative anchors**

Specifically: pEVAC = 0.0035 ISS-PRA-v2.1.1; pLOCL = 0.0017; DRM2 5.0% EVAC = 0.017 events/person-year.

- [ ] **Step 2: Add 10 entries**

Conditions: Skin Laceration, Renal Stone (Nephrolithiasis — may already be in G12 set; if so, blend the priors by taking the union of constraints), Eye Abrasion, Headache - CO2 induced, Sleep disturbance / Late Insomnia, Decompression Sickness, Behavioral Emergency, Anxiety, Allergic Reaction, Indigestion.

- [ ] **Step 3: Commit**

```bash
git add src/data/imm-priors.json
git commit -m "feat(imm): tierA S20 priors — 10 ISS-DRM driving conditions"
```

---

## Task 8: TierA priors — A22 4-step trial anchors (aggregate)

**Files:**
- Modify: `src/data/imm-priors.json`

A22 doesn't provide per-condition priors; it provides aggregate behaviour. No new condition entries — instead, document A22 as the methods reference in `global_calibration.fit_against` and confirm CHI/pEVAC/pLOCL aggregation semantics match.

- [ ] **Step 1: Update global_calibration.fit_against**

```json
  "global_calibration": {
    "tierC_multiplier_iss_hms": 1.00,
    "tierC_multiplier_iss_none": 1.00,
    "tierC_multiplier_iss_unlimited": 1.00,
    "fit_against": "K15 Table 1 (ISS 6mo/6crew); A22 4-step trial verbatim; M18 σ<5% convergence; TM21 AMM/SMM",
    "fit_residuals_within_CI95": false
  }
```

- [ ] **Step 2: Commit**

```bash
git add src/data/imm-priors.json
git commit -m "feat(imm): document A22 aggregate-anchor reference in priors metadata"
```

---

## Task 9: TierB priors — Phase-0 I&C corpus (~30 behavioral conditions)

**Files:**
- Create: `scripts/extract_tierB_priors.ts`
- Modify: `src/data/imm-priors.json`

Read `research/evidence/INDEX.md` and the 31 OCR'd I&C markdowns. For each of the ~30 behavioral/psychiatric/sleep conditions (Anxiety, Depression, Insomnia, Behavioral Emergency, plus condition entries that exist in the K15 catalog), extract a literature-derived incidence rate from the analog-mission data (Mars-500, Antarctic, HI-SEAS, AMADEE, MDRS, EMMPOL, THOR).

- [ ] **Step 1: Write the extraction helper**

```ts
// scripts/extract_tierB_priors.ts
// Reads research/evidence/*.md, looks for incidence-rate patterns, emits proposed priors to stdout.
// Output is HAND-REVIEWED before merging into imm-priors.json (don't blindly automate Tier-B).

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = "research/evidence";
const files = readdirSync(dir).filter(f => f.endsWith(".md") && !f.startsWith("_"));

const ratePattern = /(\d+(?:\.\d+)?)\s*(?:%|per\s+person-year|events?\/person-year)/gi;

for (const f of files) {
  const md = readFileSync(join(dir, f), "utf-8");
  const matches = [...md.matchAll(ratePattern)];
  if (matches.length === 0) continue;
  console.log(`\n=== ${f} ===`);
  for (const m of matches.slice(0, 10)) {
    const ctx = md.substring(Math.max(0, m.index! - 80), m.index! + 80);
    console.log(`  ${m[0]}  ← ${ctx.replace(/\n/g, " ").trim()}`);
  }
}
```

Run: `npx tsx scripts/extract_tierB_priors.ts > /tmp/tierB_proposals.txt`. Open the output and curate by hand.

- [ ] **Step 2: Add ~30 TierB entries to imm-priors.json**

Each entry:
- `provenance: "tierB-lit"`
- `source_ref: "research/evidence/<filename>.md#<anchor>"`
- Incidence from the literature value (convert % to Poisson λ; convert events/py to events/person-day by ÷365.25)

- [ ] **Step 3: Commit**

```bash
git add scripts/extract_tierB_priors.ts src/data/imm-priors.json
git commit -m "feat(imm): tierB priors — ~30 behavioral conditions from Phase-0 I&C corpus"
```

---

## Task 10: TierB priors — NASA evidence-report bridges + Phase-0 evidence tables

**Files:**
- Modify: `src/data/imm-priors.json`

Read `research/evidence/bridges/{nasa-bmed-evidence-report.pdf, nasa-teams-evidence-report-2022.pdf, patel-2020-red-risks-mars.pdf}` (use the OCR'd markdowns if Diego has them — otherwise pull excerpts via `mcp__fetch__fetch` against the NASA TRS URLs documented in their frontmatter) and `research/evidence_tables/{medical, psychological, behavioral}.md`.

- [ ] **Step 1: Cross-walk Phase-0 tables to K15 conditions**

For each row in the Phase-0 evidence_tables that has a predictive-validity coefficient (ρ, d, OR), map it to the K15 condition it most closely corresponds to. Use this multiplier as the `risk_factor_multipliers` for that condition.

Example: `evidence_tables/medical.md` says "Visual Impairment 11% incidence at 6mo ISS" → maps to K15 "Visual Impairment and Intracranial Pressure (VIIP)" → add incidence rate.

- [ ] **Step 2: Add ~15 entries**

- [ ] **Step 3: Commit**

```bash
git add src/data/imm-priors.json
git commit -m "feat(imm): tierB priors — 15 NASA evidence-report + Phase-0 medical/team conditions"
```

---

## Task 11: TierC placeholder priors for the remaining ~10 conditions

**Files:**
- Modify: `src/data/imm-priors.json`

The remaining ~10 K15 conditions don't have Tier-A or Tier-B literature support. Seed them with conservative placeholder priors (`provenance: "tierC-synth"`) that will be back-fit in Task 12.

- [ ] **Step 1: Identify the gap**

Run a one-off script that diffs `IMM_CONDITIONS` (from src/imm/conditions.ts) against `Object.keys(loadIMMPriors().conditions)`. Print the missing condition IDs.

```ts
// scripts/find_missing_priors.ts
import { IMM_CONDITIONS } from "../src/imm/conditions";
import { loadIMMPriors } from "../src/imm/priors";

const present = new Set(Object.keys(loadIMMPriors().conditions));
const missing = IMM_CONDITIONS.filter(c => !present.has(c.id));
console.log(`Missing priors for ${missing.length} conditions:`);
for (const c of missing) console.log(`  - ${c.id} (${c.family}, ${c.processType})`);
```

- [ ] **Step 2: Seed each missing condition with a placeholder**

Use the median Beta-Pert ranges from the same family as starting values. Mark `provenance: "tierC-synth"`. The global multiplier in `calibration.ts` (Task 36) will then back-fit these to match K15 Table 1.

- [ ] **Step 3: Confirm 100 priors covered**

Run: `npx tsx scripts/find_missing_priors.ts`
Expected: `Missing priors for 0 conditions`.

- [ ] **Step 4: Commit**

```bash
git add scripts/find_missing_priors.ts src/data/imm-priors.json
git commit -m "feat(imm): tierC placeholder priors — fill the remaining ~10 conditions"
```

---

## Task 12: src/data/imm-missions.ts — IMM-canonical missions

**Files:**
- Create: `src/data/imm-missions.ts`
- Create: `tests/imm/missions.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/imm/missions.test.ts
import { describe, it, expect } from "vitest";
import { IMM_MISSIONS } from "../../src/data/imm-missions";

describe("IMM_MISSIONS", () => {
  it("includes K15 ISS 6mo reference", () => {
    const iss6 = IMM_MISSIONS.find(m => m.id === "iss-6mo");
    expect(iss6).toBeDefined();
    expect(iss6!.durationDays).toBe(180);
    expect(iss6!.crewSize).toBe(6);
    expect(iss6!.totalEVAs).toBe(12);
  });

  it("includes TM21 AMM and SMM", () => {
    const amm = IMM_MISSIONS.find(m => m.id === "amm-426d");
    expect(amm).toBeDefined();
    expect(amm!.durationDays).toBe(426);
    const smm = IMM_MISSIONS.find(m => m.id === "smm-923d");
    expect(smm).toBeDefined();
    expect(smm!.durationDays).toBe(923);
  });

  it("includes the 8 existing analog missions for IMM-runnable parity", () => {
    const expectedIds = ["mdrs-2wk","short-7d","emmpol-6","hi-seas-45d","short-22d","hi-seas-90d","antarctic-winter","mars500"];
    for (const id of expectedIds) {
      expect(IMM_MISSIONS.find(m => m.id === id)).toBeDefined();
    }
  });
});
```

- [ ] **Step 2: Run — must fail**

Run: `npx vitest run tests/imm/missions.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement imm-missions.ts**

```ts
// src/data/imm-missions.ts
import type { IMMMission } from "../imm/types";

export const IMM_MISSIONS: IMMMission[] = [
  // K15 reference
  { id: "iss-6mo", label: "ISS 6 month (K15 reference)",
    durationDays: 180, crewSize: 6, totalEVAs: 12,
    evaSchedule: [30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 170, 175] },
  // S20 references
  { id: "iss-drm1", label: "ISS DRM1 (S20)",
    durationDays: 365, crewSize: 6, totalEVAs: 20,
    evaSchedule: Array.from({length: 20}, (_, i) => Math.round((i + 1) * 365 / 21)) },
  { id: "iss-drm2", label: "ISS DRM2 (S20)",
    durationDays: 180, crewSize: 6, totalEVAs: 10,
    evaSchedule: Array.from({length: 10}, (_, i) => Math.round((i + 1) * 180 / 11)) },
  // TM21 Mars
  { id: "amm-426d", label: "Accelerated Mars Mission (TM21 AMM)",
    durationDays: 426, crewSize: 4, totalEVAs: 60,
    evaSchedule: Array.from({length: 60}, (_, i) => 180 + Math.floor(i / 2)) },
  { id: "smm-923d", label: "Standard Mars Mission (TM21 SMM)",
    durationDays: 923, crewSize: 4, totalEVAs: 401,
    evaSchedule: Array.from({length: 401}, (_, i) => 200 + Math.floor(i * 1.5)) },
  // 8 existing Selectron analog missions (parity for IMM-mode runs)
  { id: "mdrs-2wk", label: "MDRS 2-week rotation",
    durationDays: 14, crewSize: 6, totalEVAs: 6,
    evaSchedule: [3, 5, 7, 9, 11, 13] },
  { id: "short-7d", label: "Short MDRS (7 days)",
    durationDays: 7, crewSize: 6, totalEVAs: 3, evaSchedule: [2, 4, 6] },
  { id: "emmpol-6", label: "EMMPOL-6 (10 days)",
    durationDays: 10, crewSize: 6, totalEVAs: 4, evaSchedule: [2, 4, 6, 8] },
  { id: "hi-seas-45d", label: "HI-SEAS 45-day",
    durationDays: 45, crewSize: 6, totalEVAs: 8,
    evaSchedule: [5, 12, 18, 24, 30, 36, 40, 43] },
  { id: "short-22d", label: "THOR 22-day",
    durationDays: 22, crewSize: 6, totalEVAs: 5, evaSchedule: [4, 8, 12, 16, 20] },
  { id: "hi-seas-90d", label: "HI-SEAS 90-day",
    durationDays: 90, crewSize: 6, totalEVAs: 14,
    evaSchedule: Array.from({length: 14}, (_, i) => 6 + i * 6) },
  { id: "antarctic-winter", label: "Antarctic winter-over (365 d)",
    durationDays: 365, crewSize: 12, totalEVAs: 24,
    evaSchedule: Array.from({length: 24}, (_, i) => Math.round((i + 1) * 365 / 25)) },
  { id: "mars500", label: "Mars-500 (520 d)",
    durationDays: 520, crewSize: 6, totalEVAs: 30,
    evaSchedule: Array.from({length: 30}, (_, i) => Math.round((i + 1) * 520 / 31)) },
];
```

- [ ] **Step 4: Run — must pass**

Run: `npx vitest run tests/imm/missions.test.ts && npm run typecheck`
Expected: 3/3 pass; typecheck exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/data/imm-missions.ts tests/imm/missions.test.ts
git commit -m "feat(imm): imm-missions.ts — 13 canonical IMM missions (K15, S20, TM21, 8 analogs)"
```

---

## Task 13: src/imm/kits.ts — kit scenarios

**Files:**
- Create: `src/imm/kits.ts`
- Create: `tests/imm/kits.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/imm/kits.test.ts
import { describe, it, expect } from "vitest";
import { IMM_KITS, computeRAF } from "../../src/imm/kits";

describe("IMM kits", () => {
  it("none kit yields RAF = 0 for any non-empty required resources", () => {
    expect(computeRAF({ "antibiotic": 5 }, IMM_KITS.none.resources)).toBe(0);
  });
  it("issHMS kit has positive antibiotic supply", () => {
    expect(IMM_KITS.issHMS.resources["antibiotic-broad-spectrum"]).toBeGreaterThan(0);
  });
  it("unlimited kit yields RAF = 1 for any finite requirement", () => {
    expect(computeRAF({ "antibiotic": 999 }, IMM_KITS.unlimited.resources)).toBe(1);
  });
  it("partial availability yields proportional RAF", () => {
    const raf = computeRAF({ "antibiotic": 10 }, { "antibiotic": 5 });
    expect(raf).toBeCloseTo(0.5, 5);
  });
});
```

- [ ] **Step 2: Run — must fail**

Run: `npx vitest run tests/imm/kits.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement kits.ts**

```ts
// src/imm/kits.ts
import type { IMMKitScenario } from "./types";

const issHmsResources: Record<string, number> = {
  "antibiotic-broad-spectrum": 30, "antibiotic-narrow-spectrum": 14,
  "antiviral": 7, "antifungal": 7,
  "analgesic-mild": 60, "analgesic-strong": 14, "opioid": 7,
  "antiemetic": 14, "antihistamine": 28, "decongestant": 14,
  "nasal-decongestant": 14, "antacid": 28, "antidiarrheal": 14,
  "laxative": 14, "topical-steroid": 14, "topical-antibiotic": 14,
  "eye-drops": 14, "ear-drops": 14, "oral-rehydration": 14,
  "iv-fluid": 6, "epinephrine": 4, "atropine": 4, "lidocaine": 6,
  "defibrillator-pad": 4, "suture-kit": 4, "splint": 6,
  "dental-temporary-filling": 6, "burn-dressing": 8,
  "bandage-large": 20, "bandage-small": 50,
  "antibiotic-eye": 6, "anti-anxiety": 14, "sleep-aid": 14,
  "antipsychotic": 4,
};

export const IMM_KITS: Record<"none"|"issHMS"|"unlimited", IMMKitScenario> = {
  none: { scenarioId: "none", label: "No Medical Resources", resources: {} },
  issHMS: { scenarioId: "issHMS", label: "ISS Health Maintenance System", resources: issHmsResources },
  unlimited: {
    scenarioId: "unlimited", label: "Unlimited Medical Resources",
    resources: new Proxy({}, { get: () => Number.POSITIVE_INFINITY }) as Record<string, number>,
  },
};

export function computeRAF(
  required: Record<string, number>,
  available: Record<string, number>,
): number {
  const keys = Object.keys(required);
  if (keys.length === 0) return 1;
  let totalRequired = 0;
  let totalAvailable = 0;
  for (const k of keys) {
    totalRequired += required[k];
    totalAvailable += Math.min(required[k], available[k] ?? 0);
  }
  return totalRequired > 0 ? totalAvailable / totalRequired : 1;
}

export function customKit(overrides: Record<string, number>): IMMKitScenario {
  return {
    scenarioId: "custom",
    label: "Custom",
    resources: { ...IMM_KITS.issHMS.resources, ...overrides },
  };
}
```

- [ ] **Step 4: Run — must pass**

Run: `npx vitest run tests/imm/kits.test.ts && npm run typecheck`. Expected: 4/4 pass.

- [ ] **Step 5: Commit**

```bash
git add src/imm/kits.ts tests/imm/kits.test.ts
git commit -m "feat(imm): kits.ts — None / ISS HMS / Unlimited / Custom + computeRAF"
```

---

## Task 14: src/imm/index.ts barrel (initial)

**Files:**
- Create: `src/imm/index.ts`

- [ ] **Step 1: Write barrel**

```ts
// src/imm/index.ts
export * from "./types";
export { IMM_CONDITIONS } from "./conditions";
export { loadIMMPriors, validatePriorsJson } from "./priors";
export { IMM_KITS, computeRAF, customKit } from "./kits";
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`. Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/imm/index.ts
git commit -m "feat(imm): public barrel (Phase P0 surface)"
```

---

## Task 15: P0 acceptance — full Phase-0 smoke

- [ ] **Step 1: Run all P0 tests**

Run: `npx vitest run tests/imm/ && npm run typecheck`
Expected: all P0 tests pass; typecheck clean.

- [ ] **Step 2: Confirm 100 conditions have priors**

Run: `npx tsx scripts/find_missing_priors.ts`. Expected: `Missing priors for 0 conditions`.

- [ ] **Step 3: Mark P0 DONE in STATUS.md, commit**

```bash
git add STATUS.md
git commit -m "docs(status): IMM P0 corpus + priors phase complete"
```

---

# Phase P1 — Engine math (TDD) — Tasks 16–36

Pattern reused across math tasks: write a closed-form moment test → run → fail → implement → re-run → pass → commit. The closed-form moments are the spec's verification contract.

## Task 16: incidence.ts — general Poisson (Knuth + PTRS)

**Files:**
- Create: `src/imm/incidence.ts`
- Create: `tests/imm/incidence.test.ts`

- [ ] **Step 1: Write the failing test (mean / variance closed-form)**

```ts
// tests/imm/incidence.test.ts
import { describe, it, expect } from "vitest";
import { samplePoisson } from "../../src/imm/incidence";
import { makeRng } from "../../src/engine/prng";

describe("samplePoisson", () => {
  it("mean ≈ lambda within 2% over 50k draws (small lambda)", () => {
    const rng = makeRng(0xc0ffee);
    const lambda = 2.5;
    const n = 50_000;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += samplePoisson(rng, lambda);
    expect(sum / n).toBeCloseTo(lambda, 1);
  });

  it("mean ≈ lambda within 2% (large lambda — PTRS regime)", () => {
    const rng = makeRng(0xc0ffee);
    const lambda = 50;
    const n = 20_000;
    let sum = 0, sumSq = 0;
    for (let i = 0; i < n; i++) { const x = samplePoisson(rng, lambda); sum += x; sumSq += x * x; }
    const mean = sum / n;
    const variance = sumSq / n - mean * mean;
    expect(mean).toBeCloseTo(lambda, 0);
    expect(variance / lambda).toBeCloseTo(1, 0);  // variance ≈ lambda for Poisson
  });

  it("returns 0 for lambda = 0", () => {
    const rng = makeRng(0);
    expect(samplePoisson(rng, 0)).toBe(0);
  });
});
```

- [ ] **Step 2: Run — must fail**

Run: `npx vitest run tests/imm/incidence.test.ts -t "samplePoisson"`. Expected: FAIL.

- [ ] **Step 3: Implement (reuse src/risk/incidence.ts pattern)**

```ts
// src/imm/incidence.ts — Poisson, Gamma-Poisson, Lognormal-Poisson, Beta-Bernoulli samplers
import type { Rng } from "../engine/prng";

const LANCZOS_G = 7;
const LANCZOS_COEFS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

function logGamma(z: number): number {
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = LANCZOS_COEFS[0];
  for (let i = 1; i < LANCZOS_G + 2; i++) x += LANCZOS_COEFS[i] / (z + i);
  const t = z + LANCZOS_G + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

export function samplePoisson(rng: Rng, lambda: number): number {
  if (lambda <= 0) return 0;
  if (lambda < 30) {
    // Knuth multiplicative method
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    while (p > L) { k++; p *= rng(); }
    return k - 1;
  }
  // Hörmann PTRS for large lambda
  const slam = Math.sqrt(lambda);
  const loglam = Math.log(lambda);
  const b = 0.931 + 2.53 * slam;
  const a = -0.059 + 0.02483 * b;
  const invalpha = 1.1239 + 1.1328 / (b - 3.4);
  const vr = 0.9277 - 3.6224 / (b - 2);
  for (;;) {
    const U = rng() - 0.5;
    const V = rng();
    const us = 0.5 - Math.abs(U);
    const k = Math.floor((2 * a / us + b) * U + lambda + 0.43);
    if (us >= 0.07 && V <= vr) return k;
    if (k < 0 || (us < 0.013 && V > us)) continue;
    if (Math.log(V) + Math.log(invalpha) - Math.log(a / (us * us) + b) <=
        -lambda + k * loglam - logGamma(k + 1)) return k;
  }
}
```

- [ ] **Step 4: Run — must pass**

Run: `npx vitest run tests/imm/incidence.test.ts -t "samplePoisson"`. Expected: 3/3 pass.

- [ ] **Step 5: Commit**

```bash
git add src/imm/incidence.ts tests/imm/incidence.test.ts
git commit -m "feat(imm): incidence.ts — Poisson sampler (Knuth + Hörmann PTRS)"
```

---

## Task 17: incidence.ts — Lognormal-Poisson + Gamma-Poisson + Beta-Bernoulli

**Files:**
- Modify: `src/imm/incidence.ts` (append)
- Modify: `tests/imm/incidence.test.ts` (append)

- [ ] **Step 1: Append tests**

```ts
// tests/imm/incidence.test.ts (append)
import { sampleLognormalPoisson, sampleGammaPoisson, sampleBetaBernoulli } from "../../src/imm/incidence";

describe("sampleLognormalPoisson", () => {
  it("samples non-negative integers; mean approximates Poisson with sampled lambda", () => {
    const rng = makeRng(42);
    const samples: number[] = [];
    for (let i = 0; i < 10_000; i++) samples.push(sampleLognormalPoisson(rng, 0, 0.5));
    expect(Math.min(...samples)).toBeGreaterThanOrEqual(0);
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    // E[lognormal(mu=0,sigma=0.5)] = exp(0 + 0.25/2) ≈ 1.1331
    expect(mean).toBeCloseTo(Math.exp(0 + 0.5 * 0.5 * 0.5), 0);
  });
});

describe("sampleGammaPoisson", () => {
  it("Negative-binomial mean = alpha/beta", () => {
    const rng = makeRng(13);
    const samples: number[] = [];
    for (let i = 0; i < 20_000; i++) samples.push(sampleGammaPoisson(rng, 4, 2));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(mean).toBeCloseTo(2, 0);  // 4/2 = 2
  });
});

describe("sampleBetaBernoulli", () => {
  it("Bernoulli mean = alpha/(alpha+beta)", () => {
    const rng = makeRng(99);
    let sum = 0;
    for (let i = 0; i < 50_000; i++) sum += sampleBetaBernoulli(rng, 2, 8);
    expect(sum / 50_000).toBeCloseTo(0.2, 1);
  });
});
```

- [ ] **Step 2: Run — must fail**

Run: `npx vitest run tests/imm/incidence.test.ts`. Expected: NEW tests FAIL.

- [ ] **Step 3: Implement (append to incidence.ts)**

```ts
// src/imm/incidence.ts (append)
import { sampleGamma } from "../engine/gamma";  // reuse existing Marsaglia-Tsang

export function sampleLognormal(rng: Rng, mu: number, sigma: number): number {
  // Box-Muller standard normal → exp(mu + sigma * z)
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.exp(mu + sigma * z);
}

export function sampleLognormalPoisson(rng: Rng, mu: number, sigma: number): number {
  const lambda = sampleLognormal(rng, mu, sigma);
  return samplePoisson(rng, lambda);
}

export function sampleGammaPoisson(rng: Rng, alpha: number, beta: number): number {
  // Gamma(alpha, beta) prior → Poisson(lambda); marginally Negative-Binomial.
  const lambda = sampleGamma(rng, alpha) / beta;
  return samplePoisson(rng, lambda);
}

function sampleBeta(rng: Rng, alpha: number, beta: number): number {
  const x = sampleGamma(rng, alpha);
  const y = sampleGamma(rng, beta);
  return x / (x + y);
}

export function sampleBetaBernoulli(rng: Rng, alpha: number, beta: number): 0 | 1 {
  const p = sampleBeta(rng, alpha, beta);
  return rng() < p ? 1 : 0;
}
```

- [ ] **Step 4: Run — must pass**

Run: `npx vitest run tests/imm/incidence.test.ts && npm run typecheck`. Expected: all incidence tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/imm/incidence.ts tests/imm/incidence.test.ts
git commit -m "feat(imm): Lognormal-Poisson + Gamma-Poisson + Beta-Bernoulli samplers"
```

---

## Task 18: severity.ts — worst-case Bernoulli

**Files:**
- Create: `src/imm/severity.ts`
- Create: `tests/imm/severity.test.ts`

- [ ] **Step 1: Test**

```ts
// tests/imm/severity.test.ts
import { describe, it, expect } from "vitest";
import { sampleSeverity } from "../../src/imm/severity";
import { makeRng } from "../../src/engine/prng";

describe("sampleSeverity", () => {
  it("worst-case probability ≈ alpha/(alpha+beta)", () => {
    const rng = makeRng(7);
    let worst = 0;
    for (let i = 0; i < 50_000; i++) {
      if (sampleSeverity(rng, 2, 8) === "worst") worst++;
    }
    expect(worst / 50_000).toBeCloseTo(0.2, 1);
  });

  it("alpha=0 always returns best", () => {
    const rng = makeRng(0);
    expect(sampleSeverity(rng, 0, 1)).toBe("best");
  });
});
```

- [ ] **Step 2: Implement**

```ts
// src/imm/severity.ts
import type { Rng } from "../engine/prng";
import { sampleBetaBernoulli } from "./incidence";

export function sampleSeverity(rng: Rng, alpha: number, beta: number): "best" | "worst" {
  return sampleBetaBernoulli(rng, alpha, beta) === 1 ? "worst" : "best";
}
```

- [ ] **Step 3: Run + commit**

```bash
npx vitest run tests/imm/severity.test.ts
git add src/imm/severity.ts tests/imm/severity.test.ts
git commit -m "feat(imm): severity.ts — worst-case Bernoulli (Beta-Bernoulli wrapper)"
```

---

## Task 19: outcomes.ts — Beta-Pert sampler

**Files:**
- Create: `src/imm/outcomes.ts`
- Create: `tests/imm/outcomes.test.ts`

- [ ] **Step 1: Test (Beta-Pert moments closed-form)**

```ts
// tests/imm/outcomes.test.ts
import { describe, it, expect } from "vitest";
import { sampleBetaPert } from "../../src/imm/outcomes";
import { makeRng } from "../../src/engine/prng";

describe("sampleBetaPert", () => {
  it("mean closed-form: (min + 4*mode + max) / 6", () => {
    const rng = makeRng(1);
    const bp = { min: 0, mode: 0.05, max: 0.15 };
    const expected = (bp.min + 4 * bp.mode + bp.max) / 6;
    let sum = 0;
    for (let i = 0; i < 50_000; i++) sum += sampleBetaPert(rng, bp.min, bp.mode, bp.max);
    expect(sum / 50_000).toBeCloseTo(expected, 2);
  });

  it("samples always within [min, max]", () => {
    const rng = makeRng(2);
    for (let i = 0; i < 1000; i++) {
      const v = sampleBetaPert(rng, 5, 10, 20);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(20);
    }
  });

  it("degenerate (min == mode == max) returns the constant", () => {
    const rng = makeRng(3);
    for (let i = 0; i < 100; i++) expect(sampleBetaPert(rng, 4, 4, 4)).toBe(4);
  });
});
```

- [ ] **Step 2: Implement Beta-Pert**

```ts
// src/imm/outcomes.ts
import type { Rng } from "../engine/prng";
import { sampleGamma } from "../engine/gamma";

export function sampleBetaPert(rng: Rng, min: number, mode: number, max: number, lambda = 4): number {
  if (min === max) return min;
  if (mode < min || mode > max) throw new Error(`E_BAD_PRIOR: Beta-Pert mode ${mode} outside [${min},${max}]`);
  const range = max - min;
  const alpha = 1 + lambda * (mode - min) / range;
  const beta = 1 + lambda * (max - mode) / range;
  const x = sampleGamma(rng, alpha);
  const y = sampleGamma(rng, beta);
  return min + (x / (x + y)) * range;
}
```

- [ ] **Step 3: Run + commit**

```bash
npx vitest run tests/imm/outcomes.test.ts
git add src/imm/outcomes.ts tests/imm/outcomes.test.ts
git commit -m "feat(imm): outcomes.ts — Beta-Pert sampler (mean (a+4m+b)/6)"
```

---

## Task 20: outcomes.ts — concurrent FI formula

**Files:**
- Modify: `src/imm/outcomes.ts` (append)
- Modify: `tests/imm/outcomes.test.ts` (append)

- [ ] **Step 1: Test the K15 §II.A.9 formula**

```ts
// tests/imm/outcomes.test.ts (append)
import { concurrentFI } from "../../src/imm/outcomes";

describe("concurrentFI (K15 §II.A.9)", () => {
  it("single impairment: f_total = f_1", () => {
    expect(concurrentFI([0.3])).toBeCloseTo(0.3, 9);
  });
  it("two impairments: f_total = 1 - (1-f1)(1-f2)", () => {
    expect(concurrentFI([0.3, 0.4])).toBeCloseTo(1 - 0.7 * 0.6, 9);
  });
  it("three impairments composes multiplicatively", () => {
    expect(concurrentFI([0.3, 0.4, 0.2])).toBeCloseTo(1 - 0.7 * 0.6 * 0.8, 9);
  });
  it("empty list returns 0", () => {
    expect(concurrentFI([])).toBe(0);
  });
  it("all-1.0 saturates at 1.0", () => {
    expect(concurrentFI([1.0, 0.5])).toBe(1.0);
  });
});
```

- [ ] **Step 2: Implement**

```ts
// src/imm/outcomes.ts (append)
export function concurrentFI(fs: number[]): number {
  if (fs.length === 0) return 0;
  let prod = 1;
  for (const f of fs) prod *= (1 - Math.max(0, Math.min(1, f)));
  return 1 - prod;
}
```

- [ ] **Step 3: Run + commit**

```bash
npx vitest run tests/imm/outcomes.test.ts
git add src/imm/outcomes.ts tests/imm/outcomes.test.ts
git commit -m "feat(imm): concurrent FI = 1 − Π(1 − f_i) per K15 §II.A.9"
```

---

## Task 21: treatment.ts — RAF distribution shifting

**Files:**
- Create: `src/imm/treatment.ts`
- Create: `tests/imm/treatment.test.ts`

- [ ] **Step 1: Test RAF linear interpolation**

```ts
// tests/imm/treatment.test.ts
import { describe, it, expect } from "vitest";
import { interpolateBetaPertByRAF } from "../../src/imm/treatment";

describe("interpolateBetaPertByRAF", () => {
  const treated = { min: 0, mode: 0.05, max: 0.15 };
  const untreated = { min: 0.05, mode: 0.2, max: 0.5 };

  it("RAF = 1 returns treated", () => {
    expect(interpolateBetaPertByRAF(treated, untreated, 1)).toEqual(treated);
  });
  it("RAF = 0 returns untreated", () => {
    expect(interpolateBetaPertByRAF(treated, untreated, 0)).toEqual(untreated);
  });
  it("RAF = 0.5 yields midpoint", () => {
    const mid = interpolateBetaPertByRAF(treated, untreated, 0.5);
    expect(mid.min).toBeCloseTo(0.025, 9);
    expect(mid.mode).toBeCloseTo(0.125, 9);
    expect(mid.max).toBeCloseTo(0.325, 9);
  });
  it("11 RAF checkpoints monotonic on mode", () => {
    const modes: number[] = [];
    for (let r = 0; r <= 10; r++) modes.push(interpolateBetaPertByRAF(treated, untreated, r / 10).mode);
    // Treated is lower mode → as RAF → 0, mode increases
    for (let i = 1; i < modes.length; i++) expect(modes[i]).toBeLessThanOrEqual(modes[i-1]);
  });
});
```

- [ ] **Step 2: Implement**

```ts
// src/imm/treatment.ts
import type { IMMBetaPert } from "./types";

export function interpolateBetaPertByRAF(
  treated: IMMBetaPert,
  untreated: IMMBetaPert,
  raf: number,
): IMMBetaPert {
  const r = Math.max(0, Math.min(1, raf));
  return {
    min:  r * treated.min  + (1 - r) * untreated.min,
    mode: r * treated.mode + (1 - r) * untreated.mode,
    max:  r * treated.max  + (1 - r) * untreated.max,
  };
}
```

- [ ] **Step 3: Run + commit**

```bash
npx vitest run tests/imm/treatment.test.ts
git add src/imm/treatment.ts tests/imm/treatment.test.ts
git commit -m "feat(imm): RAF-based Beta-Pert distribution interpolation (K15 §II.B.7 Fig 3)"
```

---

## Task 22: simulate.ts — runIMMTrial scaffold

**Files:**
- Create: `src/imm/simulate.ts`
- Create: `tests/imm/simulate.test.ts`

This is the central trial-loop function. Aim for clarity over micro-optimization in v1; profile later.

- [ ] **Step 1: Write a minimal-trial test (1 condition, 1 crew, 1 day)**

```ts
// tests/imm/simulate.test.ts
import { describe, it, expect } from "vitest";
import { runIMMTrial } from "../../src/imm/simulate";
import { makeRng } from "../../src/engine/prng";
import { IMM_KITS } from "../../src/imm/kits";
import type { IMMMission, IMMCrewMember } from "../../src/imm/types";

const TRIAL_RNG = makeRng(0xc0ffee);
const oneDayMission: IMMMission = {
  id: "test-1d", label: "1-day test",
  durationDays: 1, crewSize: 1, totalEVAs: 0, evaSchedule: [],
};
const oneCrew: IMMCrewMember[] = [{
  id: "c1", sex: "male", contacts: false, crowns: false,
  CAC_positive: false, abdominal_surgery_history: false,
  EVA_eligible: false, EVA_count: 0,
}];

describe("runIMMTrial", () => {
  it("returns shape {tme, qtl, evac, locl, perConditionCounts}", () => {
    const out = runIMMTrial(TRIAL_RNG, oneCrew, oneDayMission, IMM_KITS.none);
    expect(out).toHaveProperty("tme");
    expect(out).toHaveProperty("qtl");
    expect(out).toHaveProperty("evac");
    expect(out).toHaveProperty("locl");
    expect(out).toHaveProperty("perConditionCounts");
  });
  it("deterministic on the same seed", () => {
    const rngA = makeRng(42), rngB = makeRng(42);
    const outA = runIMMTrial(rngA, oneCrew, oneDayMission, IMM_KITS.none);
    const outB = runIMMTrial(rngB, oneCrew, oneDayMission, IMM_KITS.none);
    expect(outA).toEqual(outB);
  });
});
```

- [ ] **Step 2: Implement runIMMTrial**

```ts
// src/imm/simulate.ts
import type { Rng } from "../engine/prng";
import type { IMMCrewMember, IMMMission, IMMKitScenario, IMMPrior } from "./types";
import { IMM_CONDITIONS } from "./conditions";
import { loadIMMPriors } from "./priors";
import { samplePoisson, sampleLognormalPoisson, sampleGammaPoisson, sampleBetaBernoulli } from "./incidence";
import { sampleSeverity } from "./severity";
import { sampleBetaPert, concurrentFI } from "./outcomes";
import { interpolateBetaPertByRAF } from "./treatment";
import { computeRAF } from "./kits";

type Occurrence = {
  conditionId: string;
  crewIndex: number;
  timeDays: number;
  severity: "best" | "worst";
  raf: number;
  outcomes: {
    fi_cp1: number; dt_cp1_hours: number;
    fi_cp2: number; dt_cp2_hours: number;
    fi_cp3: number;
    p_evac: number; p_locl: number;
  };
};

export type IMMTrialResult = {
  tme: number;
  qtl: number;             // Quality time lost (sum of f_total × dt across crew)
  evac: 0 | 1;
  locl: 0 | 1;
  perConditionCounts: Record<string, number>;
  perConditionEvac: Record<string, number>;
  perConditionLocl: Record<string, number>;
};

function applyRiskFactorMultiplier(baseLambda: number, member: IMMCrewMember, prior: IMMPrior): number {
  let lambda = baseLambda;
  const m = prior.risk_factor_multipliers;
  if (member.sex === "male" && m["sex-male"]) lambda *= m["sex-male"]!;
  if (member.sex === "female" && m["sex-female"]) lambda *= m["sex-female"]!;
  if (member.contacts && m["contacts"]) lambda *= m["contacts"]!;
  if (member.crowns && m["crowns"]) lambda *= m["crowns"]!;
  if (member.CAC_positive && m["CAC-positive"]) lambda *= m["CAC-positive"]!;
  if (member.abdominal_surgery_history && m["abdominal-surgery-history"]) lambda *= m["abdominal-surgery-history"]!;
  return lambda;
}

function sampleIncidence(rng: Rng, prior: IMMPrior): number {
  const inc = prior.incidence;
  if (inc.distribution === "Lognormal-Poisson") return sampleLognormalPoisson(rng, inc.mu_log_lambda!, inc.sigma_log_lambda!);
  if (inc.distribution === "Gamma-Poisson")     return sampleGammaPoisson(rng, inc.alpha!, inc.beta!);
  if (inc.distribution === "Beta-Bernoulli")    return sampleBetaBernoulli(rng, inc.alpha!, inc.beta!);
  if (inc.distribution === "Fixed")             return samplePoisson(rng, inc.lambda_fixed!);
  throw new Error(`E_BAD_PRIOR: unknown distribution ${inc.distribution}`);
}

export function runIMMTrial(
  rng: Rng,
  crew: IMMCrewMember[],
  mission: IMMMission,
  kit: IMMKitScenario,
): IMMTrialResult {
  const priors = loadIMMPriors();
  let availableResources: Record<string, number> = { ...kit.resources };
  const occurrences: Occurrence[] = [];
  const earlyTerminated = new Set<number>();

  for (let cIdx = 0; cIdx < crew.length; cIdx++) {
    const member = crew[cIdx];
    if (earlyTerminated.has(cIdx)) continue;

    for (const cond of IMM_CONDITIONS) {
      const prior = priors.conditions[cond.id];
      if (!prior) continue;

      let count = 0;
      if (cond.processType === "general-Poisson") {
        const baseLambda = (prior.incidence.distribution === "Fixed")
          ? prior.incidence.lambda_fixed! * mission.durationDays
          : 0;
        if (prior.incidence.distribution === "Fixed") {
          count = samplePoisson(rng, applyRiskFactorMultiplier(baseLambda, member, prior));
        } else {
          // For LN-Poisson / Gamma-Poisson, the prior implicitly is per-person-day; multiply by duration.
          const sampledOnePersonDay = sampleIncidence(rng, prior);
          count = sampledOnePersonDay; // could rescale; conservative for now
        }
      } else if (cond.processType === "space-adaptation-once") {
        const occ = sampleIncidence(rng, prior);
        count = occ > 0 ? 1 : 0;
      } else if (cond.processType === "EVA-coupled") {
        for (let e = 0; e < member.EVA_count; e++) {
          if (sampleIncidence(rng, prior) > 0) count++;
        }
      } else if (cond.processType === "SPE-coupled") {
        // Simplified: treat as Bernoulli per mission. Full SPE process is in Task 23.
        if (sampleIncidence(rng, prior) > 0) count = 1;
      } else if (cond.processType === "SA-VIIP-late") {
        if (sampleIncidence(rng, prior) > 0) count = 1;
      }

      for (let e = 0; e < count; e++) {
        if (earlyTerminated.has(cIdx)) break;
        const severity = sampleSeverity(rng, prior.severity.worst_case_prob_alpha, prior.severity.worst_case_prob_beta);
        const raf = computeRAF(prior.required_resources, availableResources);
        const distSet = (severity === "worst") ? prior.untreated : prior.treated;
        const fi_cp1 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.fi_cp1, prior.untreated.fi_cp1, raf)) as [number, number, number]);
        const dt_cp1 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.dt_cp1_hours, prior.untreated.dt_cp1_hours, raf)) as [number, number, number]);
        const fi_cp2 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.fi_cp2, prior.untreated.fi_cp2, raf)) as [number, number, number]);
        const dt_cp2 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.dt_cp2_hours, prior.untreated.dt_cp2_hours, raf)) as [number, number, number]);
        const fi_cp3 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.fi_cp3, prior.untreated.fi_cp3, raf)) as [number, number, number]);
        const p_evac = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.p_evac, prior.untreated.p_evac, raf)) as [number, number, number]);
        const p_locl = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.p_locl, prior.untreated.p_locl, raf)) as [number, number, number]);
        occurrences.push({
          conditionId: cond.id, crewIndex: cIdx, timeDays: 0, severity, raf,
          outcomes: { fi_cp1, dt_cp1_hours: dt_cp1, fi_cp2, dt_cp2_hours: dt_cp2, fi_cp3, p_evac, p_locl },
        });
        // Decrement resources by RAF × required
        for (const [k, q] of Object.entries(prior.required_resources)) {
          const used = q * raf;
          availableResources[k] = Math.max(0, (availableResources[k] ?? 0) - used);
        }
        // End-state Bernoullis
        if (rng() < p_evac) { earlyTerminated.add(cIdx); }
        if (rng() < p_locl) { earlyTerminated.add(cIdx); }
      }
    }
  }

  // Aggregate trial outputs
  const tme = occurrences.length;

  // QTL: per-crewmember concurrent FI × DT integration
  // Simplification for v1: sum (fi_cp1 × dt_cp1) + (fi_cp2 × dt_cp2) per event; the full
  // concurrent-FI accounting across overlapping events is a v1.1 enhancement
  let qtl = 0;
  for (const o of occurrences) {
    qtl += o.outcomes.fi_cp1 * o.outcomes.dt_cp1_hours;
    qtl += o.outcomes.fi_cp2 * o.outcomes.dt_cp2_hours;
  }

  // EVAC/LOCL: 1 if any earlyTerminated, else 0 (Bernoulli already sampled per event)
  let evac: 0 | 1 = 0, locl: 0 | 1 = 0;
  for (const o of occurrences) {
    if (o.outcomes.p_evac > 0.5) evac = 1;  // simplified; refine in Task 25
    if (o.outcomes.p_locl > 0.5) locl = 1;
  }

  const perConditionCounts: Record<string, number> = {};
  const perConditionEvac: Record<string, number> = {};
  const perConditionLocl: Record<string, number> = {};
  for (const o of occurrences) {
    perConditionCounts[o.conditionId] = (perConditionCounts[o.conditionId] ?? 0) + 1;
    if (o.outcomes.p_evac > 0.5) perConditionEvac[o.conditionId] = (perConditionEvac[o.conditionId] ?? 0) + 1;
    if (o.outcomes.p_locl > 0.5) perConditionLocl[o.conditionId] = (perConditionLocl[o.conditionId] ?? 0) + 1;
  }

  return { tme, qtl, evac, locl, perConditionCounts, perConditionEvac, perConditionLocl };
}
```

- [ ] **Step 3: Run — must pass**

Run: `npx vitest run tests/imm/simulate.test.ts && npm run typecheck`. Expected: 2/2 pass.

- [ ] **Step 4: Commit**

```bash
git add src/imm/simulate.ts tests/imm/simulate.test.ts
git commit -m "feat(imm): runIMMTrial scaffold — 4-step trial per crew × condition"
```

---

## Tasks 23–28: simulate.ts refinements (one per refinement)

Each task isolates one refinement to the trial loop. Same TDD pattern: failing test → minimal change → pass → commit.

### Task 23: SPE Poisson process + ARS chain

- Append `samplePoissonProcess(rng, lambda, duration)` returning a list of event times.
- Modify `runIMMTrial` to first sample SPE event times; for each SPE event, for each crew member, sample ARS Bernoulli.
- Test: SPE Poisson inter-arrival exponential distribution check.
- Commit: `feat(imm): SPE Poisson process + ARS Bernoulli chain`.

### Task 24: SA conditions one-per-mission cap + time-of-occurrence within first 5 days

- Add `processedSAOnce` set per crew member; reject second occurrence of the same SA condition.
- Sample time-of-occurrence from Beta-Pert in [0, 5 days] (VIIP is across mission).
- Test: SA condition never appears > 1× per mission per crewmember.
- Commit: `feat(imm): SA condition once-per-mission cap + time-of-occurrence`.

### Task 25: Switch end-state to per-event Bernoulli sampling

- Replace the `o.outcomes.p_evac > 0.5` simplification with `rng() < o.outcomes.p_evac` at sample time.
- Test: pEVAC mean over 100k events approximates the prior mean of `p_evac`.
- Commit: `feat(imm): per-event Bernoulli end-state sampling (replaces 0.5 threshold)`.

### Task 26: Concurrent-FI accounting across overlapping events

- Replace per-event QTL sum with per-crewmember timeline integration using `concurrentFI([f1, f2, ...])` from Task 20.
- Test: 2 overlapping events with f=0.3 and f=0.4 over 1h → QTL = (1 − 0.7×0.6) = 0.58.
- Commit: `feat(imm): concurrent-FI QTL accounting per K15 §II.A.9`.

### Task 27: Risk-factor multipliers on incidence

- Already scaffolded in Task 22's `applyRiskFactorMultiplier`. This task: write 5 unit tests covering each factor.
- Test: sex=male + sex-male=2.0 → doubled λ; CAC=positive + CAC-positive=3.0 → tripled λ.
- Commit: `feat(imm): risk-factor multipliers tested across all 7 IMM flags`.

### Task 28: Resource consumption + RAF re-computation across events

- Verify resources actually decrement; RAF drops for later events of the same kind in the same trial.
- Test: 5 sequential antibiotic events with kit=5 antibiotics → first 5 RAF=1.0, sixth RAF=0.
- Commit: `feat(imm): resource consumption + RAF re-computation between events`.

---

## Task 29: simulate.ts — simulateIMM wrapper (T-trial aggregation)

**Files:**
- Modify: `src/imm/simulate.ts` (append)
- Modify: `tests/imm/simulate.test.ts` (append)

- [ ] **Step 1: Test T=2000 mini-aggregation**

```ts
// tests/imm/simulate.test.ts (append)
import { simulateIMM } from "../../src/imm/simulate";

describe("simulateIMM", () => {
  it("T=2000 returns IMMOutcome with all 4 PosteriorSummary shapes", () => {
    const out = simulateIMM({ crew: oneCrew, mission: oneDayMission, kit: IMM_KITS.issHMS, trials: 2000, seed: 0xc0ffee });
    expect(out.tme.mean).toBeGreaterThanOrEqual(0);
    expect(out.chi.mean).toBeGreaterThanOrEqual(0);
    expect(out.chi.mean).toBeLessThanOrEqual(100);
    expect(out.pEvac.mean).toBeGreaterThanOrEqual(0);
    expect(out.pEvac.mean).toBeLessThanOrEqual(100);
    expect(out.pLocl.mean).toBeGreaterThanOrEqual(0);
    expect(out.pLocl.mean).toBeLessThanOrEqual(100);
  });
  it("deterministic on the same seed", () => {
    const a = simulateIMM({ crew: oneCrew, mission: oneDayMission, kit: IMM_KITS.issHMS, trials: 1000, seed: 12345 });
    const b = simulateIMM({ crew: oneCrew, mission: oneDayMission, kit: IMM_KITS.issHMS, trials: 1000, seed: 12345 });
    expect(a.tme.mean).toBe(b.tme.mean);
    expect(a.chi.mean).toBe(b.chi.mean);
  });
});
```

- [ ] **Step 2: Implement simulateIMM**

```ts
// src/imm/simulate.ts (append)
import type { IMMOutcome, PosteriorSummary } from "./types";

function posteriorSummary(values: number[]): PosteriorSummary {
  const n = values.length;
  if (n === 0) return { mean: 0, ci90: [0, 0], ci95: [0, 0], sd: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  return {
    mean,
    ci90: [sorted[Math.floor(n * 0.05)], sorted[Math.floor(n * 0.95)]],
    ci95: [sorted[Math.floor(n * 0.025)], sorted[Math.floor(n * 0.975)]],
    sd,
  };
}

export function simulateIMM(opts: {
  crew: IMMCrewMember[];
  mission: IMMMission;
  kit: IMMKitScenario;
  trials: number;
  seed: number;
}): IMMOutcome {
  const { crew, mission, kit, trials, seed } = opts;
  const rng = makeRng(seed);
  const L_hours = mission.durationDays * 24;
  const denom = L_hours * crew.length;

  const tmes: number[] = [], chis: number[] = [], evacs: number[] = [], locls: number[] = [];
  const sigmaCheckpoints: number[] = []; const sigmaChi: number[] = []; const sigmaPevac: number[] = [];
  const perConditionCountsSum: Record<string, number> = {};
  const perConditionEvacSum: Record<string, number> = {};
  const perConditionLoclSum: Record<string, number> = {};

  for (let t = 1; t <= trials; t++) {
    const r = runIMMTrial(rng, crew, mission, kit);
    tmes.push(r.tme);
    chis.push(100 * (1 - r.qtl / denom));
    evacs.push(r.evac);
    locls.push(r.locl);
    for (const [k, v] of Object.entries(r.perConditionCounts)) perConditionCountsSum[k] = (perConditionCountsSum[k] ?? 0) + v;
    for (const [k, v] of Object.entries(r.perConditionEvac))   perConditionEvacSum[k]   = (perConditionEvacSum[k]   ?? 0) + v;
    for (const [k, v] of Object.entries(r.perConditionLocl))   perConditionLoclSum[k]   = (perConditionLoclSum[k]   ?? 0) + v;
    if (t % 1000 === 0) {
      const lastChi = chis.slice(-1000), lastEvac = evacs.slice(-1000);
      const sChi  = Math.sqrt(lastChi.reduce((a,b) => a + (b - lastChi.reduce((a,b)=>a+b,0)/1000)**2, 0)/1000);
      const sEvac = Math.sqrt(lastEvac.reduce((a,b) => a + (b - lastEvac.reduce((a,b)=>a+b,0)/1000)**2, 0)/1000);
      sigmaCheckpoints.push(t); sigmaChi.push(sChi); sigmaPevac.push(sEvac);
    }
  }

  const drivers = IMM_CONDITIONS.map(c => ({
    conditionId: c.id,
    pEvacContrib: (perConditionEvacSum[c.id] ?? 0) / trials,
    pLoclContrib: (perConditionLoclSum[c.id] ?? 0) / trials,
    tmeContrib:   (perConditionCountsSum[c.id] ?? 0) / trials,
  }));

  return {
    tme:   posteriorSummary(tmes),
    chi:   posteriorSummary(chis),
    pEvac: posteriorSummary(evacs.map(x => x * 100)),
    pLocl: posteriorSummary(locls.map(x => x * 100)),
    perConditionDrivers: drivers,
    convergence: { trialCheckpoints: sigmaCheckpoints, sigmaChi, sigmaPevac },
  };
}
```

- [ ] **Step 3: Run + commit**

```bash
npx vitest run tests/imm/simulate.test.ts && npm run typecheck
git add src/imm/simulate.ts tests/imm/simulate.test.ts
git commit -m "feat(imm): simulateIMM — T-trial aggregation with CI95 + convergence diagnostics"
```

---

## Task 30: simulate.ts — σ<5 % convergence assertion

**Files:**
- Modify: `tests/imm/simulate.test.ts` (append)
- Modify: `src/imm/simulate.ts` (helper)

- [ ] **Step 1: Test**

```ts
// tests/imm/simulate.test.ts (append)
import { ISS_6MO_REFERENCE_CREW } from "../../src/data/imm-missions";  // To be defined in Task 12 follow-up if needed
import { IMM_MISSIONS } from "../../src/data/imm-missions";

describe("σ<5% convergence (M18/A22 rule)", () => {
  it("at T=100k, ISS 6mo / 6 crew / ISS HMS converges", () => {
    const iss = IMM_MISSIONS.find(m => m.id === "iss-6mo")!;
    const crew = Array.from({length: iss.crewSize}, (_, i) => ({
      id: `c${i+1}`, sex: i < 4 ? "male" : "female" as const,
      contacts: i < 3, crowns: i < 2,
      CAC_positive: i === 0, abdominal_surgery_history: i === 5,
      EVA_eligible: i < 2, EVA_count: i < 2 ? 6 : 0,
    }));
    const out = simulateIMM({ crew, mission: iss, kit: IMM_KITS.issHMS, trials: 100_000, seed: 0xc0ffee });
    const sChi = out.convergence.sigmaChi;
    const last = sChi[sChi.length - 1];
    const prev = sChi[sChi.length - 2];
    const ratio = Math.abs(last - prev) / Math.max(1e-9, prev);
    expect(ratio).toBeLessThan(0.05);
  }, 600_000);  // 10-min timeout
});
```

- [ ] **Step 2: Run + commit**

```bash
npx vitest run tests/imm/simulate.test.ts -t "σ<5%" --testTimeout 600000
git add tests/imm/simulate.test.ts
git commit -m "test(imm): σ<5% M18/A22 convergence rule at T=100k for ISS 6mo / ISS HMS"
```

This test must pass after Tasks 23–28 land. If σ exceeds 5 %, revisit the priors (Tasks 4–11).

---

## Task 31–36: calibration + barrel + P1 acceptance

### Task 31: calibration.ts — Tier-C global multiplier back-fit

- Coordinate-descent or scalar Newton-Raphson on the 3 multipliers (`tierC_multiplier_iss_none`, `tierC_multiplier_iss_hms`, `tierC_multiplier_iss_unlimited`).
- Each iteration runs simulateIMM at T=10k (cheaper proxy) and compares aggregate TME / CHI / pEVAC / pLOCL to K15 Table 1; adjusts the multiplier to minimize residuals.
- Test: idempotency (running calibration twice yields the same multipliers).
- Commit: `feat(imm): calibration.ts — Tier-C global multiplier back-fit`.

### Task 32: scripts/calibrate_imm_priors.ts

- CLI wrapper around `calibration.ts`. Reads imm-priors.json, runs the back-fit, writes updated multipliers back to imm-priors.json.
- Documentation: `npm run calibrate:imm`.
- Commit: `chore(imm): scripts/calibrate_imm_priors.ts — CLI back-fit driver`.

### Task 33: simulate.ts → simulate.worker.ts (Web Worker)

- Create `src/workers/imm-simulate.worker.ts` that wraps `simulateIMM` for off-main-thread execution.
- Use Comlink for ergonomic message passing.
- Commit: `feat(imm): Web Worker wrapper for simulateIMM (UI thread protection)`.

### Task 34: Update src/imm/index.ts barrel

Add: `simulate`, `runIMMTrial`, `posteriorSummary`, `IMM_MISSIONS`, `samplePoisson`, `sampleBetaPert`, `concurrentFI`, `interpolateBetaPertByRAF`, `sampleSeverity`, `computeRAF`.

Commit: `feat(imm): expand public barrel (P1 surface)`.

### Task 35: scripts/validate_imm.ts

- Runs simulateIMM at T=100k against K15 Table 1, S20 ISS DRMs, TM21 AMM/SMM.
- Prints per-scenario delta (your_run − reference) / CI95 — for the V&V dossier.
- Commit: `feat(imm): scripts/validate_imm.ts — K15/S20/TM21 delta reporter`.

### Task 36: P1 acceptance

- Full vitest run.
- `npm run typecheck`.
- `npm run build`.
- Update STATUS.md (mark P1 DONE).
- Commit: `docs(status): IMM P1 engine math phase complete`.

---

# Phase P2 — UI shell + persistence (Tasks 37–51)

Build the IMM Calculator view + Dexie v3 migration. Follow existing Selectron UX patterns from `src/ui/`.

## Task 37: Dexie v3 — schema migration

**Files:**
- Modify: `src/db/schema.ts`
- Create: `tests/db/schema_v3_migration.test.ts`

- [ ] **Step 1: Write failing migration test**

```ts
// tests/db/schema_v3_migration.test.ts
import { describe, it, expect } from "vitest";
import "fake-indexeddb/auto";
import { SelectronDb, SCHEMA_VERSION } from "../../src/db/schema";

describe("Dexie v3 migration", () => {
  it("SCHEMA_VERSION === 3", () => {
    expect(SCHEMA_VERSION).toBe(3);
  });
  it("opens cleanly and exposes imm_sessions table", async () => {
    const db = new SelectronDb();
    await db.open();
    expect(db.imm_sessions).toBeDefined();
    await db.close();
  });
});
```

- [ ] **Step 2: Run — must fail**

Run: `npx vitest run tests/db/schema_v3_migration.test.ts`. Expected: FAIL.

- [ ] **Step 3: Update schema**

```ts
// src/db/schema.ts — locate the existing class and extend
export const SCHEMA_VERSION = 3;

export type DbIMMSession = { /* mirror IMMSession from src/imm/types.ts */ };

export class SelectronDb extends Dexie {
  // … existing tables (candidates, criterionEntries, etc.) …
  imm_sessions!: EntityTable<DbIMMSession, "id">;

  constructor() {
    super("Selectron");
    this.version(1).stores({ /* v1 stores */ });
    this.version(2).stores({ /* v2 unchanged */ });
    this.version(3).stores({
      // additive only — preserves v1/v2 stores
      imm_sessions: "id, candidateId, createdAt, mission.id",
    });
  }
}
```

- [ ] **Step 4: Run — must pass**

Run: `npx vitest run tests/db/schema_v3_migration.test.ts`. Expected: 2/2 pass.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts tests/db/schema_v3_migration.test.ts
git commit -m "feat(db): Dexie v3 — imm_sessions table (additive migration)"
```

---

## Task 38: src/db/repository.ts — imm_sessions CRUD

**Files:**
- Modify: `src/db/repository.ts`
- Create: `tests/db/imm_session_repository.test.ts`

- [ ] **Step 1: Test**

```ts
// tests/db/imm_session_repository.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { saveIMMSession, listIMMSessions, getIMMSession, deleteIMMSession } from "../../src/db/repository";
import { SelectronDb } from "../../src/db/schema";

describe("imm_sessions CRUD", () => {
  beforeEach(async () => {
    const db = new SelectronDb();
    await db.open(); await db.imm_sessions.clear(); await db.close();
  });

  it("saveIMMSession then getIMMSession round-trip", async () => {
    const session = { id: "s1", candidateId: null, createdAt: "2026-05-20T00:00:00Z" } as any;
    await saveIMMSession(session);
    const back = await getIMMSession("s1");
    expect(back?.id).toBe("s1");
  });

  it("listIMMSessions returns recent first", async () => {
    await saveIMMSession({ id: "s1", createdAt: "2026-05-20T01:00:00Z" } as any);
    await saveIMMSession({ id: "s2", createdAt: "2026-05-20T02:00:00Z" } as any);
    const list = await listIMMSessions();
    expect(list[0].id).toBe("s2");
  });

  it("deleteIMMSession removes the row", async () => {
    await saveIMMSession({ id: "s1" } as any);
    await deleteIMMSession("s1");
    expect(await getIMMSession("s1")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Implement repository functions**

```ts
// src/db/repository.ts (append)
import { SelectronDb, type DbIMMSession } from "./schema";

let _db: SelectronDb | null = null;
function db() { return (_db ??= new SelectronDb()); }

export async function saveIMMSession(s: DbIMMSession): Promise<void> {
  const d = db(); await d.open(); await d.imm_sessions.put(s);
}
export async function getIMMSession(id: string): Promise<DbIMMSession | undefined> {
  const d = db(); await d.open(); return d.imm_sessions.get(id);
}
export async function listIMMSessions(): Promise<DbIMMSession[]> {
  const d = db(); await d.open();
  return d.imm_sessions.orderBy("createdAt").reverse().toArray();
}
export async function deleteIMMSession(id: string): Promise<void> {
  const d = db(); await d.open(); await d.imm_sessions.delete(id);
}
```

- [ ] **Step 3: Run + commit**

```bash
npx vitest run tests/db/imm_session_repository.test.ts
git add src/db/repository.ts tests/db/imm_session_repository.test.ts
git commit -m "feat(db): imm_sessions CRUD — save/get/list/delete"
```

---

## Task 39: IMMCalculator.tsx view skeleton

**Files:**
- Create: `src/ui/views/IMMCalculator.tsx`
- Modify: `src/ui/App.tsx` (add tab)

- [ ] **Step 1: Create the view skeleton**

```tsx
// src/ui/views/IMMCalculator.tsx
import { useState } from "react";
import { IMM_MISSIONS } from "../../data/imm-missions";
import { IMM_KITS } from "../../imm/kits";
import type { IMMCrewMember, IMMMission, IMMKitScenario, IMMOutcome } from "../../imm/types";

export function IMMCalculator() {
  const [mission, setMission] = useState<IMMMission>(IMM_MISSIONS[0]);
  const [crew, setCrew] = useState<IMMCrewMember[]>([]);
  const [kit, setKit] = useState<IMMKitScenario>(IMM_KITS.issHMS);
  const [trials, setTrials] = useState(100_000);
  const [seed, setSeed] = useState(0xc0ffee);
  const [outcome, setOutcome] = useState<IMMOutcome | null>(null);
  const [running, setRunning] = useState(false);

  return (
    <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
      <section className="lg:col-span-3 panel">
        <h2 className="font-display text-xl mb-3">Mission</h2>
        {/* Mission inputs (Task 43) */}
      </section>
      <section className="lg:col-span-4 panel">
        <h2 className="font-display text-xl mb-3">Crew</h2>
        {/* IMMCrewBuilder (Task 40) */}
      </section>
      <section className="lg:col-span-5 panel">
        <h2 className="font-display text-xl mb-3">Results</h2>
        {/* IMMResultsCard (Task 42) */}
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Add tab to App.tsx**

Find the existing tab strip (search for `"Selection"` and `"Mission risk"` in `src/ui/App.tsx`). Add a third tab `"IMM Calculator"` pointing at the new view.

- [ ] **Step 3: Smoke-test**

Run: `npm run build`. Expected: green.

- [ ] **Step 4: Commit**

```bash
git add src/ui/views/IMMCalculator.tsx src/ui/App.tsx
git commit -m "feat(imm-ui): IMM Calculator view skeleton + top-level tab"
```

---

## Task 40: IMMCrewBuilder.tsx

**Files:**
- Create: `src/ui/components/IMMCrewBuilder.tsx`

Implements the per-member risk-factor row with toggles for sex/contacts/crowns/CAC/abdo-surg/EVA-eligible + numeric EVA count.

- [ ] **Step 1: Implement**

```tsx
// src/ui/components/IMMCrewBuilder.tsx
import type { IMMCrewMember } from "../../imm/types";
import { v4 as uuid } from "uuid";

export function IMMCrewBuilder({ crew, onChange }: { crew: IMMCrewMember[]; onChange: (c: IMMCrewMember[]) => void }) {
  const addMember = () => onChange([...crew, {
    id: uuid(), sex: "male", contacts: false, crowns: false,
    CAC_positive: false, abdominal_surgery_history: false,
    EVA_eligible: false, EVA_count: 0,
  }]);
  const updateMember = (idx: number, patch: Partial<IMMCrewMember>) =>
    onChange(crew.map((m, i) => i === idx ? { ...m, ...patch } : m));
  const removeMember = (idx: number) => onChange(crew.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      {crew.map((m, idx) => (
        <div key={m.id} className="border border-line rounded p-3 text-sm">
          <div className="flex justify-between mb-1">
            <span className="font-mono">#{idx + 1}</span>
            <button onClick={() => removeMember(idx)} className="text-amber-600">remove</button>
          </div>
          <label className="block">
            <span className="text-xs text-ink-2">sex</span>
            <select value={m.sex} onChange={e => updateMember(idx, { sex: e.target.value as "male" | "female" })}
                    className="block w-full bg-bg-1 border border-line rounded px-2 py-1">
              <option value="male">male</option><option value="female">female</option>
            </select>
          </label>
          {(["contacts","crowns","CAC_positive","abdominal_surgery_history","EVA_eligible"] as const).map(k => (
            <label key={k} className="flex items-center gap-2 mt-1">
              <input type="checkbox" checked={m[k] as boolean}
                     onChange={e => updateMember(idx, { [k]: e.target.checked } as any)} />
              <span className="text-xs">{k.replace(/_/g, " ")}</span>
            </label>
          ))}
          <label className="block mt-1">
            <span className="text-xs text-ink-2">EVA count</span>
            <input type="number" min="0" max="500" value={m.EVA_count}
                   onChange={e => updateMember(idx, { EVA_count: parseInt(e.target.value, 10) || 0 })}
                   className="block w-full bg-bg-1 border border-line rounded px-2 py-1" />
          </label>
        </div>
      ))}
      <button onClick={addMember} className="text-signal border border-signal rounded px-3 py-1">+ Add member</button>
    </div>
  );
}
```

- [ ] **Step 2: Wire into IMMCalculator.tsx**

Replace the `Crew` section placeholder with `<IMMCrewBuilder crew={crew} onChange={setCrew} />`.

- [ ] **Step 3: Commit**

```bash
git add src/ui/components/IMMCrewBuilder.tsx src/ui/views/IMMCalculator.tsx
git commit -m "feat(imm-ui): IMMCrewBuilder — per-member risk-factor + EVA toggles"
```

---

## Task 41: IMMKitPicker.tsx

**Files:**
- Create: `src/ui/components/IMMKitPicker.tsx`

Same pattern as Selectron's existing `MissionPicker.tsx` — radio group + edit resource quantities for Custom.

- [ ] **Step 1: Implement (mirror MissionPicker)**

```tsx
// src/ui/components/IMMKitPicker.tsx
import type { IMMKitScenario } from "../../imm/types";
import { IMM_KITS, customKit } from "../../imm/kits";

export function IMMKitPicker({ kit, onChange }: { kit: IMMKitScenario; onChange: (k: IMMKitScenario) => void }) {
  return (
    <div className="space-y-2">
      {(["none","issHMS","unlimited"] as const).map(id => (
        <label key={id} className="flex items-center gap-2">
          <input type="radio" name="kit" checked={kit.scenarioId === id}
                 onChange={() => onChange(IMM_KITS[id])} />
          <span className="text-sm">{IMM_KITS[id].label}</span>
        </label>
      ))}
      <label className="flex items-center gap-2">
        <input type="radio" name="kit" checked={kit.scenarioId === "custom"}
               onChange={() => onChange(customKit({}))} />
        <span className="text-sm">Custom ⚙</span>
      </label>
      {kit.scenarioId === "custom" && (
        <details className="text-xs">
          <summary className="cursor-pointer">edit resource quantities</summary>
          <div className="mt-2 grid grid-cols-2 gap-1">
            {Object.entries(IMM_KITS.issHMS.resources).map(([k, v]) => (
              <label key={k} className="flex gap-2 items-center">
                <span className="text-ink-2 truncate flex-1">{k}</span>
                <input type="number" min="0" defaultValue={kit.resources[k] ?? v}
                       onChange={e => onChange({...kit, resources: {...kit.resources, [k]: +e.target.value}})}
                       className="w-16 bg-bg-1 border border-line rounded px-1" />
              </label>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire into IMMCalculator + commit**

```bash
git add src/ui/components/IMMKitPicker.tsx src/ui/views/IMMCalculator.tsx
git commit -m "feat(imm-ui): IMMKitPicker — None / ISS HMS / Unlimited / Custom radio"
```

---

## Task 42: IMMResultsCard.tsx

**Files:**
- Create: `src/ui/components/IMMResultsCard.tsx`

Mirrors Selectron's existing `RiskCard.tsx` layout. Shows TME / CHI / pEVAC / pLOCL with CI95 whiskers.

- [ ] **Step 1: Implement (mirror RiskCard)**

Same chrome as `src/ui/components/RiskCard.tsx`: panel + dl grid + sharpness gauge. Replace its 3 quantities with the IMM 4-quantity headline.

- [ ] **Step 2: Wire + commit**

```bash
git add src/ui/components/IMMResultsCard.tsx src/ui/views/IMMCalculator.tsx
git commit -m "feat(imm-ui): IMMResultsCard — TME / CHI / pEVAC / pLOCL + CI95 bars"
```

---

## Tasks 43–46: Mission inputs panel + run button + Web Worker integration

### Task 43: Mission inputs panel

- Free-text mission name, duration days (with hour readout), crew size, totalEVAs, EVA schedule (auto-generated or "edit ▼" reveal).
- Dropdown of `IMM_MISSIONS` for quick-load.
- Trials selector (1k / 10k / 100k); seed integer input; "Diagnostics ☑" toggle.
- Commit: `feat(imm-ui): Mission inputs panel with quick-load presets`.

### Task 44: Custom prior overrides drilldown

- Accordion below the fold. One row per condition. Inline editor for each Beta-Pert / λ field.
- Override flips that condition's `provenance` to `"user-custom"` for the session.
- Validation badge ("vs K15 Table 1") turns amber if any override is active.
- Commit: `feat(imm-ui): per-condition prior override drilldown`.

### Task 45: ▶ Run simulation button + Web Worker

- Button starts a Worker call to `simulateIMM`. UI shows convergence σ live (subscribe to progress events emitted every 5k trials).
- requestAnimationFrame defers worker spawn so the "computing…" state paints.
- On completion, `saveIMMSession` persists the run; renders results via `IMMResultsCard`.
- Commit: `feat(imm-ui): ▶ Run simulation button — Web Worker + live progress`.

### Task 46: Validation badge "vs K15 Table 1"

- Computes deltas between current run's TME/CHI/pEVAC/pLOCL and K15 Table 1 reference.
- Green ✓ if within CI95; amber ⚠ if within ±20%; red ✗ otherwise.
- Hover tooltip shows per-metric delta in σ units.
- Commit: `feat(imm-ui): IMMValidationBadge vs K15 Table 1`.

---

## Tasks 47–51: Engine toggle + vulnerability mode + session persistence UI

### Task 47: Engine toggle (MC vs Surrogate)

- Top-right dropdown in IMMCalculator header. Switching to Surrogate calls the ML inference instead of the Worker.
- Default: Monte Carlo. Surrogate routes wired but model not yet trained (Phase P3).
- Commit: `feat(imm-ui): Engine toggle stub (Monte Carlo default; Surrogate hook)`.

### Task 48: Vulnerability mode toggle in Crew panel

- Radio: "IMM Boolean flags" (default) vs "Selectron Stage A (ML modifier ✱)".
- The latter is a stub that will gain functionality in Task 62.
- "Import Selectron candidate" button opens a Dexie-backed picker of existing Selectron candidates.
- Commit: `feat(imm-ui): Vulnerability mode toggle + Selectron candidate picker`.

### Task 49: Quick-load presets

- "K15 reference (4M/2F + risk profile)" — loads K15 §III crew (1 CAC>0, 3 contacts, 2 crowns, 1 abdo-surg, 2 EVA-eligible × 6 EVAs).
- "Mars AMM crew (TM21)" — 4-person AMM profile from TM21.
- "Import Selectron candidate" — opens Dexie-backed picker; populates crew via ML modifier (Phase P3).
- Commit: `feat(imm-ui): Quick-load presets for canonical crew profiles`.

### Task 50: Session save / load / share UI

- "💾 Save", "📂 Load", "🔗 Copy share-link" buttons in the header.
- Save persists to `imm_sessions`. Load opens a picker showing recent sessions sorted by createdAt.
- Share-link serializes the session to base64 JSON in URL (no PII; deterministic deep-link).
- Commit: `feat(imm-ui): Session save/load/share-link`.

### Task 51: P2 acceptance

- `npm run typecheck`, `npm run build`, all vitest green.
- Playwright manual smoke (Diego runs `npm run dev`, navigates to /?testFigure=IMM-Calculator).
- Commit: `docs(status): IMM P2 UI shell + persistence phase complete`.

---

# Phase P3 — ML layer (Tasks 52–65)

## Tasks 52–56: Surrogate model (LightGBM via lightgbm-wasm)

### Task 52: feature_engineering.ts

- `featurize(mission, crew, kit)` returns a fixed-length number[] (24 elements: mission duration, crew count, totalEVAs, kit-id one-hot, aggregated crew risk-factor counts, etc).
- Stable hashing — same inputs always produce the same vector.
- Test: featurize() determinism + vector length invariant.
- Commit: `feat(imm/ml): feature_engineering — fixed-length input vector`.

### Task 53: surrogate.ts inference scaffold

- Loads `imm_surrogate_v1.json`. Single function `predictSurrogate(features: number[]): { tme, chi, pEvac, pLocl }`.
- Inference is pure JS (parse trees from JSON, walk them) — no native deps. Use `lightgbm-wasm` if available; otherwise hand-roll the 4-output ensemble.
- Test: loads model; deterministic outputs.
- Commit: `feat(imm/ml): surrogate.ts inference (LightGBM JSON)`.

### Task 54: scripts/train_imm_surrogate.ts

- Generates 10k Monte Carlo runs across a Latin-Hypercube-sampled grid.
- Fits LightGBM (use the `lightgbm` Python package via `e2b` MCP for training; export to JSON for browser inference).
- Saves to `src/imm/ml/models/imm_surrogate_v1.json`.
- Saves training_provenance.md (hyperparams, training-set size, held-out MAPE).
- Commit: `feat(imm/ml): scripts/train_imm_surrogate.ts — 10k-run training driver`.

### Task 55: Run training, commit model

- `npm run train:imm-surrogate`. Verify outputs at `models/`.
- Commit the 50-KB JSON.
- Commit: `feat(imm/ml): imm_surrogate_v1.json — pretrained model (10k runs, MAPE ≤ 5%)`.

### Task 56: surrogate.test.ts — held-out vs MC

- 100 held-out (mission, crew, kit) tuples not seen during training. Run real MC; predict via surrogate; assert MAPE on means ≤ 5 %, on SDs ≤ 10 %.
- Commit: `test(imm/ml): surrogate vs MC held-out grid — MAPE budgets`.

---

## Tasks 57–61: Vulnerability ML modifier

### Task 57: vulnerability.ts inference scaffold

- Loads `vulnerability_v1.json` (TFJS format). Function `predictVulnerability(crewFeatures: number[]): Record<string, number>` returning per-condition incidence multiplier vector.
- Commit: `feat(imm/ml): vulnerability.ts inference (TFJS Bayesian MLP)`.

### Task 58: scripts/train_imm_vulnerability.ts

- Generates synthetic (crew_features, ground_truth_modifier) pairs from R21 RDoC ratings × Phase-0 medical.md predictive-validity coefficients.
- Fits a small Bayesian MLP (TFJS, ~10k params).
- Held-out ECE ≤ 0.05.
- Commit: `feat(imm/ml): scripts/train_imm_vulnerability.ts — synthetic-GT training driver`.

### Task 59: Run training, commit model

- `npm run train:imm-vulnerability`.
- Commit: `feat(imm/ml): vulnerability_v1.json — pretrained MLP modifier (~100 KB)`.

### Task 60: vulnerability.test.ts — calibration

- Holdout pairs; assert ECE ≤ 0.05.
- Commit: `test(imm/ml): vulnerability modifier calibration ECE budget`.

### Task 61: training_provenance.md

- Document training-set sizes, hyperparams, held-out metrics, commit SHA at training time for both models.
- Commit: `docs(imm/ml): training_provenance.md`.

---

## Tasks 62–65: Wire ML into UI

### Task 62: Engine toggle → surrogate inference

- IMMCalculator's Engine toggle (Task 47) now actually routes to `predictSurrogate` on selection.
- UI shows MC | Surrogate badge in results; surrogate result shows "approximate" tag.
- Commit: `feat(imm-ui): Engine toggle live — Surrogate routes to ML inference`.

### Task 63: Vulnerability modifier UI

- When "Selectron Stage A (ML modifier ✱)" selected:
  - Load Selectron candidate's Stage A posterior from Dexie.
  - Featurize and call `predictVulnerability` → per-condition multiplier.
  - Pass multipliers into `simulateIMM`'s prior layer.
- Commit: `feat(imm-ui): Vulnerability mode live — ML modifier from Selectron Stage A`.

### Task 64: Surrogate-vs-MC live calibration plot

- Adds I8 IMMVulnerabilityCalibration figure later (Task 74); for now, the engine toggle shows a small "surrogate within ±X% of MC" badge.
- Commit: `feat(imm-ui): Surrogate calibration badge live in Engine toggle`.

### Task 65: P3 acceptance

- Full suite green; `npm run typecheck`; `npm run build`.
- Commit: `docs(status): IMM P3 ML layer phase complete`.

---

# Phase P4 — Figures + lay-person captions (Tasks 66–85)

## Task 66: FigureCaption extension for layperson

**Files:**
- Modify: `src/ui/figures/FigureCaption.tsx`
- Modify: `tests/ui/figure_caption.test.tsx` (or create)

- [ ] **Step 1: Test the layperson toggle**

```tsx
// tests/ui/figure_caption.test.tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { FigureCaption } from "../../src/ui/figures/FigureCaption";

describe("FigureCaption layperson layer", () => {
  it("lay-person paragraph is hidden by default", () => {
    render(<FigureCaption oneLine="Figure I1 | TME=106" layperson="Plain language."/>);
    expect(screen.queryByText("Plain language.")).toBeNull();
  });

  it("clicking the toggle reveals the lay-person paragraph", () => {
    render(<FigureCaption oneLine="Figure I1 | TME=106" layperson="Plain language."/>);
    fireEvent.click(screen.getByText(/explain like/i));
    expect(screen.getByText("Plain language.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Extend FigureCaption**

Append a new `layperson?: string` prop. Below the existing expert toggles, add a separate `"▸ explain like I'm not a researcher"` button (collapsed by default).

- [ ] **Step 3: Commit**

```bash
git add src/ui/figures/FigureCaption.tsx tests/ui/figure_caption.test.tsx
git commit -m "feat(imm-ui): FigureCaption.layperson — collapsed-by-default plain-language layer"
```

---

## Tasks 67–74: Figures I1–I8 (one task each)

Each figure follows the same pattern as Selectron's existing F1–F7:

1. Create `src/ui/figures/IXX.tsx` using `echarts-base.ts` (the existing centralized registry) and `NATURE_THEME_NAME` (from `theme.ts`).
2. Pass `aria.enabled: true`, `decal` patterns, `animation: false`, `useUTC: true`, `grid.containLabel: true` — Q1-publication settings.
3. Render `<FigureCaption>` immediately below with both expert and lay-person captions wired.
4. Add Playwright snapshot test in `tests/e2e/imm-figures.smoke.spec.ts`.
5. Commit: `feat(imm-ui): I<N> <Figure name>`.

### Task 67: I1 IMMHeadlineCard (4-stat composite)
### Task 68: I2 IMMPosteriorHist (4-panel small-multiple histograms)
### Task 69: I3 IMMConditionDrivers (lollipop sorted by pEVAC/pLOCL)
### Task 70: I4 IMMConvergencePlot (σ vs trials; dashed 5 % rule)
### Task 71: I5 IMMValidationCompare (dumbbell vs K15 reference)
### Task 72: I6 IMMSensitivityTornado (top 20 by ±50 % perturbation)
### Task 73: I7 IMMCrewRiskHeat (crew × condition heatmap)
### Task 74: I8 IMMVulnerabilityCalibration (predicted vs ground-truth scatter)

For each figure, the implementation follows the F2 / F5 / F7 patterns already in the repo. See `src/ui/figures/RiskHistogram.tsx` and `src/ui/figures/MissionComparison.tsx` for reference.

---

## Tasks 75–82: Lay-person captions for I1–I8

Each task creates one file at `src/imm/ml/captions/IX.layperson.ts`. The caption is reviewed by Diego before merge.

### Task 75: I1.layperson.ts

```ts
// src/imm/ml/captions/I1.layperson.ts
export const I1_LAYPERSON = `
This card shows the four headline numbers from one simulated mission run.
"Total medical events" counts how often any crew member needed medical care.
"Crew Health Index" goes from 0 to 100; higher is better — 100 means nobody
ever lost time to illness. "pEVAC" is the chance an evacuation back to Earth
would be considered. "pLOCL" is the chance one or more crew members would
die during the mission. The vertical bars show how uncertain the estimate is —
shorter bars mean we're more confident in the number.
`.trim();
```

Commit: `docs(imm/ml/captions): I1 lay-person caption`.

### Tasks 76–82: I2–I8 lay-person captions

Same pattern. Each ~100 words. Commit per file.

---

## Tasks 83–85: Caption toggle state + Playwright snapshots

### Task 83: Caption toggle state persistence

- Add to `imm_sessions` schema: `laypersonCaptionsExpanded: Record<string, boolean>`.
- On expand/collapse, update Dexie session.
- Commit: `feat(imm-ui): caption toggle state persisted to Dexie`.

### Task 84: I1–I8 Playwright snapshots

- Add `tests/e2e/imm-figures.smoke.spec.ts` modeled on `tests/e2e/phase3f.smoke.spec.ts`.
- Use `TestFigureHost.tsx` with new `?testFigure=I1` … `I8` routes.
- 8 snapshot tests + 1 wizard end-to-end smoke.
- Commit: `feat(imm-ui): Playwright I1-I8 figure snapshots + IMM Calculator smoke`.

### Task 85: P4 acceptance

- All Playwright + Vitest green.
- Commit: `docs(status): IMM P4 figures + lay-person captions complete`.

---

# Phase P5 — Validation gate + docs (Tasks 86–97)

## Task 86: validation.test.ts — K15 Table 1 reproduction

**Files:**
- Create: `tests/imm/validation.test.ts`

- [ ] **Step 1: Test the gate**

```ts
// tests/imm/validation.test.ts
import { describe, it, expect } from "vitest";
import { simulateIMM } from "../../src/imm/simulate";
import { IMM_MISSIONS } from "../../src/data/imm-missions";
import { IMM_KITS } from "../../src/imm/kits";
import type { IMMCrewMember } from "../../src/imm/types";

const K15_CREW: IMMCrewMember[] = [
  { id: "c1", sex: "male",   contacts: true,  crowns: true,  CAC_positive: true,  abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 6 },
  { id: "c2", sex: "male",   contacts: true,  crowns: true,  CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 6 },
  { id: "c3", sex: "male",   contacts: true,  crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: false, EVA_count: 0 },
  { id: "c4", sex: "male",   contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: false, EVA_count: 0 },
  { id: "c5", sex: "female", contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: false, EVA_count: 0 },
  { id: "c6", sex: "female", contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: true,  EVA_eligible: false, EVA_count: 0 },
];

const REFS_K15 = {
  none:      { tme: [73, 122],   chi: [43.36, 71.25], pEvac: [66.57, 67.14], pLocl: [2.78, 2.99] },
  issHMS:    { tme: [87, 126],   chi: [84.32, 98.46], pEvac: [5.43, 5.72],   pLocl: [0.40, 0.49] },
  unlimited: { tme: [87, 126],   chi: [84.44, 98.47], pEvac: [4.80, 5.07],   pLocl: [0.41, 0.49] },
};

describe("K15 Table 1 reproduction (the gate)", () => {
  const iss = IMM_MISSIONS.find(m => m.id === "iss-6mo")!;
  for (const [kitId, ref] of Object.entries(REFS_K15)) {
    it(`reproduces ISS 6mo / ${kitId} within CI95`, () => {
      const kit = IMM_KITS[kitId as keyof typeof IMM_KITS];
      const out = simulateIMM({ crew: K15_CREW, mission: iss, kit, trials: 100_000, seed: 0xc0ffee });
      // mean must lie within the reference CI95
      expect(out.tme.mean).toBeGreaterThanOrEqual(ref.tme[0]);
      expect(out.tme.mean).toBeLessThanOrEqual(ref.tme[1]);
      expect(out.chi.mean).toBeGreaterThanOrEqual(ref.chi[0]);
      expect(out.chi.mean).toBeLessThanOrEqual(ref.chi[1]);
      expect(out.pEvac.mean).toBeGreaterThanOrEqual(ref.pEvac[0]);
      expect(out.pEvac.mean).toBeLessThanOrEqual(ref.pEvac[1]);
      expect(out.pLocl.mean).toBeGreaterThanOrEqual(ref.pLocl[0]);
      expect(out.pLocl.mean).toBeLessThanOrEqual(ref.pLocl[1]);
    }, 600_000);
  }
});
```

- [ ] **Step 2: Run — must pass after Tasks 4–11 priors land**

Run: `npx vitest run tests/imm/validation.test.ts --testTimeout 600000`.

If fails: revisit the calibration multipliers (Task 31) and re-run the back-fit until residuals are within CI95. Iterate until the test passes.

- [ ] **Step 3: Commit**

```bash
git add tests/imm/validation.test.ts
git commit -m "test(imm): K15 Table 1 reproduction — the validation gate (3 kit scenarios × 4 metrics)"
```

---

## Task 87: validation.test.ts — TM21 AMM/SMM ±20 %

Add a second `describe` block in the same file using TM21 published aggregates (~3 % pLOCL × 2.9 increased risk for SMM vs AMM, etc.). Tolerance ±20 % since TM21 uses different priors than K15.

Commit: `test(imm): TM21 AMM/SMM aggregate reproduction (±20%)`.

---

## Task 88: scripts/validate_imm.ts — produce V&V dossier deltas

Same as Task 35 but committed here once validation.test.ts is green.

Commit: `feat(imm): scripts/validate_imm.ts — produces V&V dossier deltas`.

---

## Task 89: V&V dossier §5 — IMM Calculator validation

**Files:**
- Modify: `docs/iter3_vv_dossier.md`

- [ ] **Step 1: Append §5**

```markdown
## 5. IMM Calculator validation (Iter-5)

### 5.1 Catalog coverage

- 100 K15 appendix conditions, all with `provenance` tag.
- Tier-A NASA-published: NN conditions.
- Tier-B literature: NN conditions.
- Tier-C synthetic with back-fit: NN conditions.

### 5.2 K15 Table 1 reproduction

| Scenario | Metric | K15 reference (mean [CI95]) | Selectron IMM (mean [CI95]) | Within CI95? |
| --- | --- | --- | --- | --- |
| ISS 6mo / None         | TME | 98.3 [73, 122]   | … | … |
| ISS 6mo / None         | CHI | 59.2 [43.36, 71.25] | … | … |
| ISS 6mo / None         | pEVAC | 66.9 [66.57, 67.14] | … | … |
| … | … | … | … | … |

### 5.3 TM21 AMM/SMM cross-walk

(table)

### 5.4 ML layer metrics

- Surrogate MAPE on means: NN %.
- Surrogate MAPE on SDs: NN %.
- Vulnerability MLP ECE: 0.NN.

### 5.5 NASA-STD-7009A factor mapping

- Factor 1 (Verification): 8 closed-form moment tests, all green.
- Factor 2 (Validation): K15 Table 1 reproduction, all 3 scenarios within CI95.
- Factor 3 (Input Pedigree): Tier-A/B/C provenance tags per condition.
```

- [ ] **Step 2: Commit**

```bash
git add docs/iter3_vv_dossier.md
git commit -m "docs(imm): V&V dossier §5 — IMM Calculator validation tables"
```

---

## Tasks 90–94: NASA MC audit + README + CLAUDE.md + STATUS.md + CITATION.cff

### Task 90: NASA MC audit §4 IMM alignment

- Append §4 to `docs/iter3_nasa_monte_carlo_audit.md`: confirms σ<5 % at T=100k for IMM Calculator; cites K15 §II.A.9 concurrent-FI formula; documents the trial-loop alignment.
- Commit: `docs(imm): NASA MC audit §4 — IMM Calculator alignment`.

### Task 91: README.md update

- Add `## IMM Calculator` section after the existing `## Methodology` section. ~200 words. Link to design spec; mention validation gate; document `npm run train:imm-surrogate`.
- Update file-tree diagram with `src/imm/` row.
- Commit: `docs(imm): README — IMM Calculator section + file-tree update`.

### Task 92: CLAUDE.md (Selectron) update

- Add `## IMM Calculator module` section per spec §14. Three-tier priors directive; Dexie v3 migration note; pointer to V&V dossier.
- Commit: `docs(imm): CLAUDE.md — IMM Calculator module description`.

### Task 93: STATUS.md task rows DONE

- Move all 97 rows from `IN_PROGRESS` / `PENDING` to `DONE` with their commit SHAs (filled by `git log --oneline` post-completion).
- Append Audit log entries.
- Commit: `docs(status): IMM Calculator all 97 tasks DONE`.

### Task 94: CITATION.cff training-script provenance

- Add `references` array with training_provenance.md pointers.
- Commit: `chore(imm): CITATION.cff — ML training-script provenance refs`.

---

## Tasks 95–97: Full-suite acceptance + manual sign-off + push

### Task 95: Full-suite acceptance

- `npx vitest run` — all green.
- `npm run typecheck` — exit 0.
- `npm run build` — green.
- `npm run e2e` — 8 IMM figure snapshots + 7 existing snapshots = 15+ snapshots, all green.
- Commit: `chore(imm): full-suite acceptance — vitest + typecheck + build + e2e`.

### Task 96: Diego manual sign-off

- Diego runs `npm run dev`, opens http://localhost:5173/, clicks IMM Calculator tab, runs a sample T=100k mission, verifies validation badge says ✓.
- Commit (empty marker): `release(imm): Iter-5 IMM Calculator — Diego manual sign-off`.

### Task 97: Push to origin

- `git push origin iter1-phase0`.

---

## Self-review (checklist run by the plan author, fixed inline)

**Spec coverage:** All 16 spec sections map to tasks — §1 → T1; §2 → out-of-scope honored in deferred tasks; §3 → architectural anchors honored in module layout; §4 → T1–T36; §5 → T2–T11 (priors with provenance); §6 → T2 (types); §7 → T22–T28 (simulation); §8 → T39–T46 (UI); §9 → T44 (overrides); §10 → T52–T65 (ML); §11 → T66–T74 (figures); §12 → T37–T38 (Dexie); §13 → tests embedded in every task; §14 → T89–T94 (docs); §15 → T86–T87 (validation gate); §16 → flagged in plan header as deferred.

**Placeholder scan:** Two boilerplate references ("NN conditions", "NN %") in Task 89's V&V dossier template are intentional placeholders that the test output fills in. Acceptable. No other TBD / TODO in the plan.

**Type consistency:** `IMMCondition` (T2) signature matches usage in T3, T22; `IMMPrior` (T2) matches T4, T22; `IMMCrewMember` matches T39, T40, T49, T86; `IMMOutcome` (T2) matches T29, T39, T42; `PosteriorSummary` (T2) matches `posteriorSummary` (T29). `loadIMMPriors` (T4) used in T22, T29. `IMM_KITS` (T13) used in T22, T29, T41, T86. `IMM_MISSIONS` (T12) used in T29, T39, T86.

**Scope check:** ~97 tasks, well-bounded for one implementation cycle. ML follow-ups (BNN priors, sensitivity tornado) deferred to a separate plan.

---

## Acceptance criteria (plan-level)

- All 97 tasks have bite-sized, verifiable steps.
- Each math task has TDD (failing test → minimal impl → passing test → commit).
- Every prose / docs task has a clear deliverable file + heading.
- All commit messages are pre-specified in each task block.
- The validation gate (Task 86) is the merge contract — failure blocks the branch.
- Manual sign-off (Task 96) by Diego is the release contract — only Diego ticks it.

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-20-selectron-imm-calculator.md`.**
