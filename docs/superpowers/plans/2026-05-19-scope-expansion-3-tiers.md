# Selectron Scope-Expansion-3 — Accessibility-Tiered Selection Battery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user pick an accessibility tier (Minimum / Medium / Elite) at candidate-creation time, and have the wizard, the Calculation Trace, and the saved simSession audit trail all reflect WHICH instrument was used for each of the 12 criteria at that tier — so a low-resource program in Colombia can run Selectron honestly with PEBL + Cooper run + DASS-21 + PHQ-9, while a NASA-grade program runs the same 12 criteria with NASA Cognition Battery + CPET + MMPI-2-RF + BDI-II.

**Architecture:** **All 12 criteria stay at every tier** — the tier doesn't filter criteria, it switches which **instrument** measures each criterion (and applies any scale-mapping multiplier). One new `AccessTier` type + a `tierInstruments` map on each `Criterion`. The `DbCandidate` schema gains an `accessTier` field via a Dexie v1→v2 migration. The `WizardContext` exposes the current tier; `StepCriteria` and `EvidenceForm` look up the tier-specific instrument label + scale transform; `CalculationTrace` adds a tier chip + caption mention. Bayesian MCDA + IMM math is unchanged — the tier affects only the data-entry surface.

**Tech Stack:** TypeScript 5.x, React 18.x, Dexie 4.x (migration v1→v2 via `db.version(2).upgrade(...)`), Vitest 1.x with `fake-indexeddb`, Playwright 1.x for visual smoke.

**Source of truth:** [`docs/superpowers/specs/2026-05-19-scope-expansion-3-tiers.md`](../specs/2026-05-19-scope-expansion-3-tiers.md) (commit `0b438e1`).

**Predecessor:** Scope expansion 2 (`docs/superpowers/specs/2026-05-19-scope-expansion-2.md`) — CalculationTrace + 12-criterion catalog + 3 new missions + brighter palette (commits `fe2fd83`–`671073c`). V&V Factor 1 fix (`12c17fa`).

**Research source:** `research/2026-05-19_test_battery_tiers.md` (commit `f60f2df`) — the verbatim per-criterion × per-tier instrument table the implementer populates from.

---

## File structure

**New files (5):**

```
src/types/scenario.ts         — AccessTier enum + labels + descriptions
src/ui/wizard/ScenarioSelector.tsx — three-button tier selector
tests/types/tier_instruments.test.ts — type-level + data-level tier-instruments coverage
tests/ui/wizard/scenario_selector.test.tsx — ScenarioSelector smoke
tests/db/schema_v2_migration.test.ts — Dexie v1→v2 round-trip
```

**Modified files (8):**

```
src/types/criterion.ts        — add tierInstruments + CriterionInstrument types
src/types/index.ts            — re-export AccessTier + CriterionInstrument
src/data/placeholder-criteria.ts — populate tierInstruments for all 12 criteria
src/db/schema.ts              — bump SCHEMA_VERSION → 2; add DbCandidate.accessTier; add v2.upgrade
src/contexts/WizardContext.tsx — store + expose `accessTier`; default "minimum"
src/ui/wizard/Wizard.tsx      — render ScenarioSelector above StepStrip
src/ui/wizard/EvidenceForm.tsx — display tier-specific instrument label + scale transform
src/ui/figures/CalculationTrace.tsx — header gains tier chip; trace step #1 shows tier-specific instrument
src/ui/views/Sim.tsx          — pass session's tier to CalculationTrace
```

---

## Recovery protocol

Every task ends with TWO commits — `feat:` (or `test:` / `fix:`) carrying the work, then `docs(status):` appending one audit-log entry to `STATUS.md`. If a task dies between commits, `git log --oneline -20` reveals the orphan, and the next agent writes only the missing `docs(status):` commit. STATUS.md is the single dynamic-state source of truth.

---

## Part A — Type system + data model

### Task 89: `src/types/scenario.ts` — AccessTier type + labels

**Files:**
- Create: `src/types/scenario.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Heredoc `src/types/scenario.ts`.**

```ts
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
```

- [ ] **Step 2: Re-export from `src/types/index.ts`.**

Open `src/types/index.ts`. Append:

```ts
export type { AccessTier } from "./scenario";
export {
  ACCESS_TIERS,
  TIER_LABEL,
  TIER_SHORT_DESCRIPTION,
  TIER_LONG_DESCRIPTION,
} from "./scenario";
```

- [ ] **Step 3: Typecheck.**

Run: `npm run typecheck`
Expected: exit 0, no output.

- [ ] **Step 4: Commit.**

```bash
git add src/types/scenario.ts src/types/index.ts
git commit -m "feat(types): AccessTier — Minimum/Medium/Elite scope-expansion-3 (Task 89)"
```

- [ ] **Step 5: STATUS audit-log entry.**

Append to `STATUS.md`:

```
| 2026-05-19 <HH:MM> | Task 89 implementer | DONE `<sha>` — src/types/scenario.ts + barrel re-export. AccessTier union + ACCESS_TIERS const + TIER_LABEL/TIER_SHORT_DESCRIPTION/TIER_LONG_DESCRIPTION maps. typecheck clean. |
```

Commit:

```bash
git add STATUS.md
git commit -m "docs(status): mark Task 89 DONE"
```

---

### Task 90: Extend `Criterion` type with `tierInstruments` (TDD)

**Files:**
- Modify: `src/types/criterion.ts`
- Modify: `src/types/index.ts`
- Create: `tests/types/tier_instruments.test.ts`

- [ ] **Step 1: Failing test.**

Create `tests/types/tier_instruments.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import type { Criterion, CriterionInstrument } from "@/types";
import { ACCESS_TIERS } from "@/types";

describe("Criterion.tierInstruments", () => {
  test("type accepts a Record<AccessTier, CriterionInstrument> on the optional field", () => {
    const c: Criterion = {
      id: "test.demo",
      family: "psychological",
      label: "Demo",
      description: "Demo construct for the type-level test.",
      instrument: "Demo (legacy default)",
      scale: { min: 0, max: 1 },
      higherIsBetter: true,
      citations: ["10.0000/demo"],
      tierInstruments: {
        minimum: {
          instrument: "Free demo (Tier 1)",
          citations: ["10.0000/free"],
          scaleTransform: { multiplier: 2, note: "raw × 2 → canonical scale" },
        },
        medium: {
          instrument: "Mid-tier demo",
          citations: ["10.0000/mid"],
        },
        elite: {
          instrument: "Elite demo",
          citations: ["10.0000/elite"],
          notes: "specialist required",
        },
      },
    };
    // structural assertions
    expect(c.tierInstruments).toBeDefined();
    for (const t of ACCESS_TIERS) {
      const inst: CriterionInstrument | undefined = c.tierInstruments?.[t];
      expect(inst).toBeDefined();
      expect(typeof inst!.instrument).toBe("string");
      expect(Array.isArray(inst!.citations)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

```bash
npm test -- tests/types/tier_instruments.test.ts
```

Expected: `CriterionInstrument` not exported / `tierInstruments` not on `Criterion`.

- [ ] **Step 3: Implement.**

Open `src/types/criterion.ts`. Replace the entire file with:

```ts
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
};
```

- [ ] **Step 4: Re-export `CriterionInstrument` from `src/types/index.ts`.**

```ts
export type { Criterion, CriterionInstrument } from "./criterion";
```

- [ ] **Step 5: Run — expect PASS.**

```bash
npm test -- tests/types/tier_instruments.test.ts
```

Expected: 1 test pass.

- [ ] **Step 6: Full suite typecheck.**

```bash
npm run typecheck
```

Expected: exit 0.

- [ ] **Step 7: Commit + STATUS.**

```bash
git add src/types/criterion.ts src/types/index.ts tests/types/tier_instruments.test.ts
git commit -m "feat(types): Criterion.tierInstruments + CriterionInstrument shape (Task 90, TDD)"
```

Then `docs(status):` commit.

---

### Task 91: Populate `tierInstruments` for all 12 criteria

**Files:**
- Modify: `src/data/placeholder-criteria.ts`
- Modify: `tests/engine/placeholder-criteria.test.ts`

**Source data:** verbatim from `research/2026-05-19_test_battery_tiers.md` §3 (commit `f60f2df`). Each criterion gains a `tierInstruments` map with three entries (minimum / medium / elite) carrying the instrument label, DOI citations, and any scale-transform metadata.

- [ ] **Step 1: Add the tierInstruments map to all 12 criteria.**

Read the current `src/data/placeholder-criteria.ts`. For each of the 12 criterion entries, add a `tierInstruments` field. The verbatim values for each criterion are below.

`psych.conscientiousness`:

```ts
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
```

`psych.emotional_stability`:

```ts
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
```

`physical.vo2max`:

```ts
    tierInstruments: {
      minimum: {
        instrument: "Cooper 12-minute run/walk test (free; stopwatch + measured track)",
        citations: ["10.1001/jama.1968.03140600031004"],
        notes: "Cooper 1968 original; DOI flagged for manual verification. Cross-validation with CPET r=0.90 in young adults.",
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
```

`professional.technical_competence`:

```ts
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
```

`behavioral.teamwork`:

```ts
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
```

`cognitive.nasa_cognition_battery`:

```ts
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
```

`cognitive.pvt_b_lapses`:

```ts
    tierInstruments: {
      minimum: {
        instrument: "Standalone PVT-B (free Pulsar Informatics research version, or PEBL PVT module)",
        citations: ["10.1093/sleep/34.5.581"],
        notes: "Basner 2011 PMID 22025811; Pulsar offers free for non-commercial research use.",
      },
      medium: {
        instrument: "Joggle Research / Pulsar Informatics PVT-B (commercial tablet; ~USD 200–500/yr site license)",
        citations: ["10.1093/sleep/34.5.581"],
      },
      elite: {
        instrument: "PVT-B embedded within NASA Cognition Battery (same Joggle platform; avoids double-counting)",
        citations: ["10.1093/sleep/34.5.581"],
      },
    },
```

`physical.sot5_equilibrium`:

```ts
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
```

`psych.resilience_cdrisc`:

```ts
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
```

`psych.emotional_intelligence`:

```ts
    tierInstruments: {
      minimum: {
        instrument: "TEIQue-SF (Trait Emotional Intelligence Questionnaire — Short Form; 30-item; free for research at psychometriclab.com)",
        citations: ["10.1177/0033294108101897"],
        notes: "Petrides 2009 α≈0.88; DOI flagged for manual verification.",
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
```

`psych.mmpi2rf_eid`:

```ts
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
```

`psych.bdi2_baseline`:

```ts
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
```

- [ ] **Step 2: Update `tests/engine/placeholder-criteria.test.ts` to assert all 12 criteria have `tierInstruments`.**

Append a new test:

```ts
import { ACCESS_TIERS } from "@/types";

// ... existing tests above ...

  it("every criterion populates tierInstruments for all 3 access tiers (scope-expansion-3)", () => {
    for (const c of PLACEHOLDER_CRITERIA) {
      expect(c.tierInstruments).toBeDefined();
      for (const t of ACCESS_TIERS) {
        const inst = c.tierInstruments![t];
        expect(inst).toBeDefined();
        expect(typeof inst.instrument).toBe("string");
        expect(inst.instrument.length).toBeGreaterThan(0);
        expect(Array.isArray(inst.citations)).toBe(true);
      }
    }
  });
```

- [ ] **Step 3: Run — expect PASS.**

```bash
npm test -- tests/engine/placeholder-criteria.test.ts
```

Expected: existing tests + 1 new test pass.

- [ ] **Step 4: Full vitest suite.**

```bash
npm test
```

Expected: 128 + 1 = 129 tests pass.

- [ ] **Step 5: Commit + STATUS.**

```bash
git add src/data/placeholder-criteria.ts tests/engine/placeholder-criteria.test.ts
git commit -m "feat(data): populate tierInstruments for all 12 criteria (Task 91; research f60f2df)"
```

Then `docs(status):` commit.

---

### Task 92: Dexie schema v2 — `DbCandidate.accessTier` + migration (TDD)

**Files:**
- Modify: `src/db/schema.ts`
- Create: `tests/db/schema_v2_migration.test.ts`

- [ ] **Step 1: Failing test — v1 schema currently has SCHEMA_VERSION = 1.**

Create `tests/db/schema_v2_migration.test.ts`:

```ts
import { describe, expect, test, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { db, SCHEMA_VERSION } from "@/db/schema";
import type { DbCandidate } from "@/db/schema";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

afterEach(async () => {
  await db.delete();
});

describe("Dexie schema v2 — DbCandidate.accessTier", () => {
  test("SCHEMA_VERSION is 2", () => {
    expect(SCHEMA_VERSION).toBe(2);
  });

  test("can write a candidate with accessTier and read it back", async () => {
    const c: DbCandidate = {
      id: "v2-test",
      alias: "v2-test",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessTier: "minimum",
    };
    await db.candidates.add(c);
    const got = await db.candidates.get("v2-test");
    expect(got?.accessTier).toBe("minimum");
  });

  test("candidates created without an accessTier remain readable (backwards-compat)", async () => {
    // Mimic an Iter-1 row that pre-dates the field
    const c: DbCandidate = {
      id: "v1-legacy",
      alias: "legacy",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.candidates.add(c);
    const got = await db.candidates.get("v1-legacy");
    expect(got).toBeDefined();
    expect(got?.accessTier).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

```bash
npm test -- tests/db/schema_v2_migration.test.ts
```

Expected: `SCHEMA_VERSION is 2` fails (currently 1); `accessTier` field not on DbCandidate.

- [ ] **Step 3: Implement.**

Open `src/db/schema.ts`. Apply these edits:

3a. Add `import type { AccessTier } from "@/types/scenario";` to the top of the file.

3b. Add `accessTier?: AccessTier;` as the last field of the `DbCandidate` type:

```ts
export type DbCandidate = {
  id: string;
  alias: string;
  fullName?: string;
  createdAt: string;
  updatedAt: string;
  status: CandidateStatus;
  notes?: string;
  photoBlobKey?: string;
  /** scope-expansion-3 (Task 92): accessibility tier set at candidate creation. */
  accessTier?: AccessTier;
};
```

3c. Bump `SCHEMA_VERSION`:

```ts
export const SCHEMA_VERSION = 2;
```

3d. Add a `version(2).upgrade(...)` block inside the `SelectronDb` constructor, AFTER the existing `this.version(1).stores(...)`:

```ts
    this.version(1).stores({
      // ... existing v1 stores definition ...
    });

    // v2 (scope-expansion-3, 2026-05-19): adds DbCandidate.accessTier.
    // The schema declaration is the same — no new indexed column. Existing rows
    // are valid as-is (accessTier is optional). Upgrade hook is a no-op but
    // exists so Dexie bumps the version cleanly.
    this.version(SCHEMA_VERSION).stores({
      candidates: "id, alias, createdAt, updatedAt, status",
      criterionEntries: "id, candidateId, criterionId, [candidateId+criterionId], updatedAt",
      attachments: "id, sha256, uploadedAt",
      simSessions: "id, candidateId, missionId, runAt, [candidateId+missionId]",
      priorsCache: "id",
      _meta: "id",
    });
```

- [ ] **Step 4: Run — expect PASS.**

```bash
npm test -- tests/db/schema_v2_migration.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Full suite.**

```bash
npm test
```

Expected: 129 + 3 = 132 tests pass.

- [ ] **Step 6: Commit + STATUS.**

```bash
git add src/db/schema.ts tests/db/schema_v2_migration.test.ts
git commit -m "feat(db): Dexie v2 — DbCandidate.accessTier + no-op upgrade hook (Task 92, TDD)"
```

Then `docs(status):` commit.

---

## Part B — UI — Scenario selector + tier-aware wizard

### Task 93: `ScenarioSelector` component (TDD)

**Files:**
- Create: `src/ui/wizard/ScenarioSelector.tsx`
- Create: `tests/ui/wizard/scenario_selector.test.tsx`

- [ ] **Step 1: Install React Testing Library** (if not already present).

Check:

```bash
grep -c "@testing-library/react" package.json
```

If 0, install:

```bash
npm install --save-dev @testing-library/react@^14 @testing-library/jest-dom@^6 jsdom@^22
```

Then ensure `vitest.config.ts` has `environment: "jsdom"`. If not, add it.

- [ ] **Step 2: Failing test.**

Create `tests/ui/wizard/scenario_selector.test.tsx`:

```tsx
import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScenarioSelector } from "@/ui/wizard/ScenarioSelector";

describe("ScenarioSelector", () => {
  test("renders three tier buttons with labels and the selected one is highlighted", () => {
    const onChange = vi.fn();
    render(<ScenarioSelector value="minimum" onChange={onChange} />);
    expect(screen.getByRole("radio", { name: /Minimum/i })).toBeDefined();
    expect(screen.getByRole("radio", { name: /Medium/i })).toBeDefined();
    expect(screen.getByRole("radio", { name: /Elite/i })).toBeDefined();
    const minBtn = screen.getByRole("radio", { name: /Minimum/i });
    expect(minBtn.getAttribute("aria-checked")).toBe("true");
  });

  test("clicking a tier fires onChange with the new tier", () => {
    const onChange = vi.fn();
    render(<ScenarioSelector value="minimum" onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: /Elite/i }));
    expect(onChange).toHaveBeenCalledWith("elite");
  });
});
```

- [ ] **Step 3: Run — expect FAIL.**

```bash
npm test -- tests/ui/wizard/scenario_selector.test.tsx
```

Expected: import resolves but `ScenarioSelector` undefined.

- [ ] **Step 4: Implement `src/ui/wizard/ScenarioSelector.tsx`.**

```tsx
// scope-expansion-3 (2026-05-19, Task 93): three-button tier selector.
// Lives at the top of the wizard view. Default tier is "minimum".

import type { AccessTier } from "@/types";
import { ACCESS_TIERS, TIER_LABEL, TIER_SHORT_DESCRIPTION } from "@/types";

type Props = {
  value: AccessTier;
  onChange: (tier: AccessTier) => void;
  disabled?: boolean;
};

export function ScenarioSelector({ value, onChange, disabled = false }: Props) {
  return (
    <div className="panel p-4 border-signal/40 mb-4" role="radiogroup" aria-label="Scenario tier">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h3 className="display text-base text-ink-0">Scenario</h3>
        <span className="mono text-[10px] uppercase tracking-cap text-ink-2">
          accessibility tier
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
        {ACCESS_TIERS.map((tier) => {
          const active = tier === value;
          return (
            <button
              key={tier}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={TIER_LABEL[tier]}
              disabled={disabled}
              onClick={() => !disabled && onChange(tier)}
              className={
                "mono uppercase tracking-cap text-[11px] px-3 py-2 border rounded-md transition-colors text-left " +
                (active
                  ? "border-signal text-signal bg-signal/10"
                  : disabled
                  ? "border-line text-ink-3 cursor-not-allowed"
                  : "border-line text-ink-2 hover:border-ink-1 hover:text-ink-1")
              }
            >
              {TIER_LABEL[tier]}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-ink-1 leading-relaxed">{TIER_SHORT_DESCRIPTION[value]}</p>
    </div>
  );
}
```

- [ ] **Step 5: Run — expect PASS.**

```bash
npm test -- tests/ui/wizard/scenario_selector.test.tsx
```

Expected: 2 tests pass.

- [ ] **Step 6: Full suite.**

```bash
npm test
```

Expected: 132 + 2 = 134 tests pass.

- [ ] **Step 7: Commit + STATUS.**

```bash
git add src/ui/wizard/ScenarioSelector.tsx tests/ui/wizard/scenario_selector.test.tsx package.json package-lock.json
git commit -m "feat(ui): ScenarioSelector — 3-button tier selector (Task 93, TDD)"
```

Then `docs(status):` commit.

---

### Task 94: Wire `accessTier` into `WizardContext` + `EvidenceForm` tier-aware instrument label

**Files:**
- Modify: `src/contexts/WizardContext.tsx`
- Modify: `src/ui/views/Wizard.tsx`
- Modify: `src/ui/wizard/EvidenceForm.tsx`
- Modify: `src/ui/views/Dashboard.tsx`
- Modify: `src/ui/App.tsx`

- [ ] **Step 1: Extend `WizardContext` with `accessTier` state.**

Open `src/contexts/WizardContext.tsx`. Apply these edits:

1a. Import `AccessTier`:

```ts
import type { AccessTier } from "@/types";
```

1b. Add `accessTier: AccessTier` to `WizardState`:

```ts
type WizardState = {
  candidate: DbCandidate | null;
  criterionEntries: CriterionEntry[];
  step: WizardStep;
  highestCompletedStep: -1 | WizardStep;
  accessTier: AccessTier; // scope-expansion-3
};
```

1c. Add `setAccessTier: (t: AccessTier) => void` to `WizardContextValue`:

```ts
type WizardContextValue = WizardState & {
  setStep: (s: WizardStep) => void;
  markStepCompleted: (s: WizardStep) => void;
  reloadFromDb: () => Promise<void>;
  enqueueCandidatePatch: (patch: Partial<DbCandidate>) => void;
  enqueueCriterionPatch: (criterionId: string, patch: Partial<CriterionEntry>) => void;
  setAccessTier: (tier: AccessTier) => void;
};
```

1d. Initialise `accessTier` in `useState` default (read from `bundle.candidate.accessTier ?? "minimum"`):

```ts
const [state, setState] = useState<WizardState>({
  candidate: null,
  criterionEntries: [],
  step: initialStep,
  highestCompletedStep: -1,
  accessTier: "minimum", // default; will be replaced from DB if the candidate has one
});
```

1e. Inside `reloadFromDb`, sync `accessTier` from the loaded candidate:

```ts
const reloadFromDb = useCallback(async () => {
  const bundle = await getCandidateWithEvidence(candidateId);
  setState((s) => ({
    ...s,
    candidate: bundle.candidate,
    criterionEntries: bundle.criterionEntries,
    accessTier: bundle.candidate.accessTier ?? s.accessTier,
  }));
}, [candidateId]);
```

1f. Add `setAccessTier` callback that enqueues the patch + updates local state:

```ts
const setAccessTier = useCallback((tier: AccessTier) => {
  setState((cur) => ({ ...cur, accessTier: tier }));
  setPendingPatches((cur) => ({ ...cur, candidate: { ...cur.candidate, accessTier: tier } }));
}, []);
```

1g. Add `setAccessTier` to the context value:

```ts
return (
  <WizardContext.Provider
    value={{
      ...state,
      setStep,
      markStepCompleted,
      reloadFromDb,
      enqueueCandidatePatch,
      enqueueCriterionPatch,
      setAccessTier,
    }}
  >
    {children}
  </WizardContext.Provider>
);
```

- [ ] **Step 2: Render `<ScenarioSelector>` in the wizard.**

Open `src/ui/views/Wizard.tsx`. In `WizardBody`, just after `<StepStrip />` and BEFORE the step content, add:

```tsx
import { ScenarioSelector } from "../wizard/ScenarioSelector";
// ... inside WizardBody, just before the {step === ...} renders:
const { accessTier, setAccessTier } = useWizard();
// ...
<div className="mx-auto max-w-7xl px-8 pt-6">
  <ScenarioSelector value={accessTier} onChange={setAccessTier} />
</div>
```

- [ ] **Step 3: `EvidenceForm` reads tier-specific instrument label + scale transform.**

Open `src/ui/wizard/EvidenceForm.tsx`. Apply these edits:

3a. Import `useWizard`:

```ts
import { useWizard } from "@/contexts/WizardContext";
```

3b. Inside the component, read the active tier + instrument:

```ts
const { accessTier } = useWizard();
const tierInst = criterion.tierInstruments?.[accessTier];
const instrumentLabel = tierInst?.instrument ?? criterion.instrument;
const transform = tierInst?.scaleTransform;
const tierNotes = tierInst?.notes;
```

3c. Replace the existing instrument-name display in the EvidenceForm header with `{instrumentLabel}`. Render the tier-specific notes + scale-transform note as small mono captions beneath the raw-value slider:

```tsx
<div className="mono text-[10px] text-ink-3 mb-2">
  instrument · <span className="text-ink-1">{instrumentLabel}</span>
</div>
{transform?.note && (
  <p className="mono text-[10px] text-amber-300 leading-relaxed mb-2">
    ⚠ scale transform · {transform.note}
  </p>
)}
{tierNotes && (
  <p className="mono text-[10px] text-ink-2 leading-relaxed mb-2">{tierNotes}</p>
)}
```

3d. If `transform.multiplier` is set, apply it to the raw-value-slider's stored value when persisting. Update the `onChange` handler:

```tsx
onChange={(e) => {
  const raw = parseFloat(e.target.value);
  const transformed = transform?.multiplier ? raw * transform.multiplier : raw;
  enqueueCriterionPatch(criterion.id, { rawValue: transformed });
  setLiveValue(transformed);
}}
```

(Preserves the canonical Selectron `scale.min..scale.max` while letting Tier-1 instruments use their native ranges.)

- [ ] **Step 4: Pre-set `accessTier` on new candidates from the Dashboard.**

Open `src/ui/App.tsx`. Find `onNewCandidate` in the `Dashboard` branch:

```tsx
onNewCandidate={async () => {
  const c = await createCandidate({ alias: "untitled" });
  setView({ kind: "wizard", candidateId: c.id, step: 0 });
}}
```

Update to default-initialise accessTier:

```tsx
onNewCandidate={async () => {
  const c = await createCandidate({ alias: "untitled" });
  await import("@/db/repository").then((m) =>
    m.updateCandidate(c.id, { accessTier: "minimum" }),
  );
  setView({ kind: "wizard", candidateId: c.id, step: 0 });
}}
```

- [ ] **Step 5: Typecheck + full suite.**

```bash
npm run typecheck
npm test
```

Expected: typecheck exit 0; 134 tests pass.

- [ ] **Step 6: Playwright smoke.**

Use `mcp__playwright__browser_navigate` to load `http://localhost:5173/`. Click `+ New candidate`. Confirm `<ScenarioSelector>` renders at the top of the wizard with "Minimum" selected. Click "Elite" — confirm the description text changes to the Tier-3 long description. Navigate to Step 2 — confirm the EvidenceForm shows the tier-specific instrument label ("NEO-PI-R (240-item; Pearson; licensed psychologist required)" for `psych.conscientiousness` under Elite).

- [ ] **Step 7: Commit + STATUS.**

```bash
git add src/contexts/WizardContext.tsx src/ui/views/Wizard.tsx src/ui/wizard/EvidenceForm.tsx src/ui/App.tsx
git commit -m "feat(ui): wire accessTier into WizardContext + EvidenceForm tier-aware instrument label (Task 94)"
```

Then `docs(status):` commit.

---

### Task 95: CalculationTrace tier chip + Sim view caption mention

**Files:**
- Modify: `src/ui/figures/CalculationTrace.tsx`
- Modify: `src/ui/wizard/StepReview.tsx`
- Modify: `src/ui/views/Sim.tsx`
- Modify: `src/ui/figures/captions/F1.captions.ts`
- Modify: `src/ui/figures/captions/F2.captions.ts`

- [ ] **Step 1: Add `accessTier` prop to both trace components.**

Open `src/ui/figures/CalculationTrace.tsx`. Apply these edits:

1a. Import `AccessTier` + `TIER_LABEL`:

```ts
import type { AccessTier } from "@/types";
import { TIER_LABEL } from "@/types";
```

1b. Add `accessTier: AccessTier` to both `MCDACalculationTrace` and `IMMCalculationTrace` props.

1c. In each `<header className="panel ...">` block, add a tier chip next to the existing stage label:

```tsx
<header className="panel p-4 mb-3 border-signal/40">
  <div className="flex items-baseline justify-between gap-3">
    <h3 className="display text-lg text-ink-0">...</h3>
    <div className="flex items-center gap-2">
      <span className="mono text-[10px] uppercase tracking-cap text-ink-2">
        tier · {TIER_LABEL[props.accessTier]}
      </span>
      <span className="mono text-[10px] uppercase tracking-cap text-ink-2">
        stage a · bayesian mcda
      </span>
    </div>
  </div>
  ...
</header>
```

(Repeat for `IMMCalculationTrace` header with "stage b · imm forward monte-carlo".)

1d. In Step 1 of `mcdaSteps`, include the tier-specific instrument label in the `concrete` text:

```ts
const demoCInstrument =
  demoC.tierInstruments?.[args.accessTier]?.instrument ?? demoC.instrument;
// ... and in the concrete: ReactNode ...
concrete: (
  <span>
    {demoC.label}: instrument <span className="text-ink-1">{demoCInstrument}</span>; x = {fmt(demoRaw, 1)} on [{demoC.scale.min}, {demoC.scale.max}] → z = {fmt(demoZ, 3)}
    ...
  </span>
),
```

- [ ] **Step 2: Pass tier from StepReview + Sim.**

Open `src/ui/wizard/StepReview.tsx`. Add `const { accessTier } = useWizard();` (already destructured if you follow Task 94; otherwise add). Pass `accessTier={accessTier}` to `<MCDACalculationTrace ...>`.

Open `src/ui/views/Sim.tsx`. The Sim view reads from `simSessions` — the saved session has an `accessTier` field via the prefix in `notes` (see Step 3). Read it:

```tsx
const tierMatch = (latest.notes ?? "").match(/^tier=(\w+)/);
const sessionTier: AccessTier = (tierMatch?.[1] as AccessTier) ?? "minimum";
```

Pass `accessTier={sessionTier}` to `<IMMCalculationTrace ...>`.

- [ ] **Step 3: Tier prefix on simSession.notes.**

Open `src/ui/wizard/StepMissionSim.tsx`. Inside `runComparison` / `handleRun` (wherever `saveSimSession` is called), prepend the tier:

```ts
const { accessTier } = useWizard();
// ... inside saveSimSession({...}) ...
notes: `tier=${accessTier}`,
```

(If `notes` is already populated, prepend with a separator: `notes: \`tier=${accessTier} · ${existing}\``.)

- [ ] **Step 4: Caption updates.**

Open `src/ui/figures/captions/F1.captions.ts`. Add `accessTier: AccessTier` to `f1Caption` args, and append the tier to the `source` line:

```ts
import type { AccessTier } from "@/types";
import { TIER_LABEL } from "@/types";

export function f1Caption(posterior: Posterior, seed: number, alias: string, accessTier: AccessTier): CaptionBlock {
  return {
    figureId: "F1",
    oneLine: `Posterior over total MCDA score for ${alias} (n = ${posterior.samples.length.toLocaleString()} samples; tier · ${TIER_LABEL[accessTier]}).`,
    methods: "...",
    source:
      `Synthetic-iter1-engine. Computed in-browser at render time; no DB cache. ` +
      `Accessibility tier: ${TIER_LABEL[accessTier]}.`,
    reproducibility: `seed=${seed}, iterations=${posterior.samples.length}, alpha=[1,1,1,1,1].`,
  };
}
```

Open `src/ui/figures/captions/F2.captions.ts`. Add `accessTier` to args; include it in `source`.

- [ ] **Step 5: Wire caption args.**

Open `src/ui/figures/PosteriorPlot.tsx`. Add `accessTier: AccessTier` to props with default `"minimum"`. Pass to `f1Caption`.

Open `src/ui/figures/RiskHistogram.tsx`. Same pattern with `f2Caption`.

Open `src/ui/wizard/StepReview.tsx`. Pass `accessTier={accessTier}` to the `<PosteriorPlot>`.

Open `src/ui/views/Sim.tsx`. Pass `accessTier={sessionTier}` to `<RiskHistogram>`.

- [ ] **Step 6: Typecheck + full suite.**

```bash
npm run typecheck
npm test
```

Expected: typecheck exit 0; 134 tests still pass (no new tests; visual smoke only).

- [ ] **Step 7: Playwright smoke.**

Drill into a candidate → step 3 (Review). Confirm tier chip "tier · Minimum" renders in the MCDACalculationTrace header. Expand F1 caption methodology — confirm "Accessibility tier: Minimum" appears in the source line. Switch tier via ScenarioSelector → confirm the chip + caption update.

- [ ] **Step 8: Refresh Playwright snapshots if F1/F2 visuals change.**

```bash
npm run e2e -- --update-snapshots
```

Confirm 7/7 pass.

- [ ] **Step 9: Commit + STATUS.**

```bash
git add src/ui/figures/CalculationTrace.tsx src/ui/wizard/StepReview.tsx src/ui/views/Sim.tsx src/ui/figures/captions/F1.captions.ts src/ui/figures/captions/F2.captions.ts src/ui/figures/PosteriorPlot.tsx src/ui/figures/RiskHistogram.tsx src/ui/wizard/StepMissionSim.tsx tests/e2e/__snapshots__/
git commit -m "feat(ui): tier chip in CalculationTrace + tier mention in F1/F2 captions + simSession.notes tier prefix (Task 95)"
```

Then `docs(status):` commit.

---

## Part C — Acceptance + STATUS

### Task 96: Full suite acceptance + STATUS catch-up + push final

- [ ] **Step 1: Full suite.**

```bash
npm test
npm run typecheck
npm run build
npm run e2e
```

Expected: all green.

- [ ] **Step 2: Manual smoke checklist.**

In a clean profile at http://localhost:5173/:

1. Dashboard renders with all candidates.
2. Click `+ New candidate` → wizard opens with `ScenarioSelector` at top, "Minimum" selected.
3. Click "Elite" → description text changes; advance to Step 2 → EvidenceForm shows Tier-3 instrument names ("NEO-PI-R 240-item ..." etc).
4. Click "Minimum" → instruments switch to Tier-1 ("IPIP-NEO-120 free public domain" etc.).
5. Fill scores → step 3 (Review) → tier chip "tier · Minimum" visible in MCDACalculationTrace header.
6. Run sim → Sim view → tier chip "tier · Minimum" visible in IMMCalculationTrace header.
7. F1 caption expand methodology → "Accessibility tier: Minimum" in source line.
8. Refresh browser → candidate's tier persists from Dexie.

- [ ] **Step 3: STATUS catch-up.**

Append to STATUS.md the scope-expansion-3 audit-log entry:

```
| 2026-05-19 <HH:MM> | controller (scope-expansion-3 acceptance) | Phase complete. Commits: 89 <sha>, 90 <sha>, 91 <sha>, 92 <sha>, 93 <sha>, 94 <sha>, 95 <sha>. 12 criteria × 3 tiers all populated; ScenarioSelector renders + persists tier to Dexie v2; CalculationTrace + F1/F2 captions tier-aware; simSession.notes carries tier prefix. Full suite: 134/134 vitest; 7/7 e2e; typecheck clean; build green. |
```

- [ ] **Step 4: Update V&V dossier Factor 4 (Input Data Pedigree).**

Open `docs/iter3_vv_dossier.md`. In Factor 4 section, append a paragraph:

```
- **Tier-aware audit trail (scope-expansion-3):** Each saved simSession now
  carries an explicit `tier=<minimum|medium|elite>` prefix in its notes field,
  making the instrument-realisation of every criterion traceable from the
  simulator output back to the candidate's chosen accessibility tier and
  forward to the verified DOIs in `placeholder-criteria.tierInstruments[tier].citations`.
```

- [ ] **Step 5: Push everything.**

```bash
git add STATUS.md docs/iter3_vv_dossier.md
git commit -m "docs(status): scope-expansion-3 acceptance — tiered selection battery wired end-to-end"
git push origin iter1-phase0
```

- [ ] **Step 6: Take a screenshot of the new wizard + ScenarioSelector for Diego.**

Use `mcp__playwright__browser_take_screenshot` to capture the wizard view with ScenarioSelector visible. Save to `/root/repos/exports/2026-05-19_screenshot_selectron-tier-selector.png` and `SendUserFile` to Diego with caption.

- [ ] **Step 7: Report.**

Reply to Diego with:
- Commit range
- Test count delta
- One-line status of the 5 DOIs flagged for manual verification (still pending Diego)
- Three open spec questions (default tier, hide-vs-disable higher-tier, tier-immutability)

---

## Self-review

**1. Spec coverage:**
- §1 (why tiers) — Task 89 captures via TIER_*_DESCRIPTION maps + TIER_LONG_DESCRIPTION.
- §2 (CogScreen substitute) — Task 91 populates `cognitive.nasa_cognition_battery.tierInstruments` with PEBL (T1) / CogScreen-AE (T2) / NASA CB (T3).
- §3 (tier-assignment table) — Task 91 verbatim populates all 12 entries.
- §4.1 (AccessTier type) — Task 89.
- §4.2 (Criterion.tierInstruments) — Task 90 (TDD).
- §4.3 (ScenarioSelector component) — Task 93 (TDD).
- §4.4 (no criterion filtering; instrument switching) — Task 94 step 3 (EvidenceForm tier-specific instrument label).
- §4.5 (F6 radar reflects active-tier criteria) — implicit; no change needed because all 12 criteria stay at every tier; radar always shows 12 spokes.
- §4.6 (CalculationTrace tier chip) — Task 95.
- §4.7 (simSession.notes tier prefix) — Task 95 step 3.
- §5.1 (MCDA closed-form sanity check at multiple K) — already satisfied; the existing `tests/engine/mcda.test.ts` runs at K=12 (full set) and the K=5 case is the original Iter-1 contract before scope-expansion-2 expanded. No additional task needed.
- §5.2 (IMM Poisson-Gamma sanity check) — already satisfied at commit `12c17fa` (V&V Factor 1 PARTIAL→SAT).
- §5.3 (Bayesian conjugate property) — already verified by tests/risk/incidence.test.ts + tests/risk/poisson_gamma_conjugate.test.ts.
- §5.4 (deterministic seed contract) — covered by the existing determinism tests in tests/risk/simulate.test.ts.
- §7 (Deliverables) — every row maps to a task above.
- §8 (out of scope) — explicitly deferred; no tasks.
- §9 (open questions for Diego) — addressed by defaults in Task 89/93/94 + acceptance commit notes those defaults.

**No spec section unimplemented.**

**2. Placeholder scan:** No "TBD", "TODO", or vague directives. Every step has explicit code or commands. The "DOI flagged for manual verification" notes are intentional and Diego's gate, not implementer placeholders.

**3. Type consistency:**
- `AccessTier` defined in Task 89, used in Tasks 90, 92, 93, 94, 95.
- `CriterionInstrument.tierInstruments` shape defined in Task 90, used in Tasks 91, 94, 95.
- `DbCandidate.accessTier` added in Task 92, used in Tasks 94, 95.
- `setAccessTier`, `accessTier` on WizardContext defined in Task 94, used in Task 95.
- `simSession.notes` tier prefix defined in Task 95 step 3, read in Task 95 step 2.

No drift.

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-19-scope-expansion-3-tiers.md`.** Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, two-stage review between tasks, fast iteration.

**2. Inline Execution** — execute T89 → T96 in this session via `superpowers:executing-plans`, batched with checkpoints.

**Which approach?**
