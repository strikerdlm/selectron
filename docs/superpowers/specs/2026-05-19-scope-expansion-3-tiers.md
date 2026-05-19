# Scope expansion 3 — accessibility-tiered selection battery + scenario selector

**Date:** 2026-05-19
**Trigger:** Diego in-conversation directive:
> "We do not have access to the NASA Cognition Battery, I need you to find an alternative (cogscreen?) please assign three categories for the minimum profile (most critical tests needed), medium profile (nice to have tests), and real spaceflight (elite profile). These categories are done because not all scenarios can be completed in a low income country with desire to participate in an space analog mission. These categories must be aligned with science and evidence and supported so I need you to /plan the categories and make the user select the scenario. Make sure the calculations and computations are correct and make sure the sources are real citations from the scientific literature."

**Status:** SPEC — research in flight, plan + implementation downstream.

**Predecessor:** [`2026-05-19-scope-expansion-2.md`](2026-05-19-scope-expansion-2.md) (calculation transparency + 12-criterion catalog; commits `fe2fd83`–`671073c`).

---

## 1. Why three tiers?

Selectron currently ships 12 criteria selected by the literature subagent at `research/2026-05-19_selection_test_battery_expansion.md` (commit `5ee9840`). Several of those tests (NASA Cognition Battery, SOT-5 CDP posturography, MSCEIT) require commercial licenses, specialized hardware, and a clinical-grade testing facility. A low-budget analog-mission program in a low-income country **cannot run them**, but should still be able to use Selectron honestly with whatever tests it can afford.

Three accessibility tiers solve this without sacrificing rigour:

| Tier | Profile | Budget envelope | Typical user |
|---|---|---|---|
| **Minimum** | Most critical tests · paper-based or free software · no specialized hardware | < USD 5 k tooling | university student club, hobbyist analog campaign, low-income-country research lab |
| **Medium** | Adds modest-cost instruments + clinical-psychology consultation | USD 5–50 k tooling | mid-size research facility, well-equipped university |
| **Elite (real spaceflight)** | Full battery including computerized dynamic posturography, full metabolic cart, sleep lab, clinical psychiatry | > USD 50 k tooling + agency-grade staff | Tier-1 space agency selection campaign, fully funded research program |

Tier choice is the user's. Selectron's calculation pipeline (MCDA + IMM) operates identically across tiers; the only difference is **which Criterion rows feed it**. The model degrades gracefully — running with 5 inputs instead of 12 is statistically valid, just narrower in scope, and the posterior CI₉₀ widens to reflect the reduced information.

## 2. CogScreen substitute

The NASA Cognition Battery (`cognitive.nasa_cognition_battery`) was added at commit `15f64aa` based on Basner 2015. Diego cannot license it. The research subagent is verifying **CogScreen-AE (CogScreen-Aeromedical Edition, Kay 1995)** as a substitute used by the FAA for pilot fitness — accessible to non-NASA programs at a modest commercial cost.

If CogScreen-AE itself is too gated, the fallback candidates are:
- **PEBL** (Psychology Experiment Building Language, open-source) — runs a subset of cognitive-battery analogs at zero license cost.
- **CANTAB** (Cambridge Neuropsychological Test Automated Battery) — commercial but more accessible than NASA's Pulsar/Joggle infrastructure.
- **MicroCog** — older FAA-era battery, may be unavailable.

**To be ratified** when the research subagent returns. Citation will be a peer-reviewed predictive-validity DOI for the chosen substitute.

## 3. Tier assignments (research-pending)

The research subagent's output at `research/2026-05-19_test_battery_tiers.md` will provide a per-criterion tier table. Expected structure:

| Criterion id | Min | Med | Elite | Rationale |
|---|---|---|---|---|
| `psych.conscientiousness` | ✓ | ✓ | ✓ | NEO-FFI 60-item free; NEO-PI-R commercial for richer assessment |
| `psych.emotional_stability` | ✓ | ✓ | ✓ | same |
| `physical.vo2max` | ✓ | ✓ | ✓ | Cooper 12-min run (T1) vs CPET with metabolic cart (T3) |
| `professional.technical_competence` | ✓ | ✓ | ✓ | structured behavioural rubric, no hardware |
| `behavioral.teamwork` | ✓ | ✓ | ✓ | behavioral-based interview, no hardware |
| `cognitive.cogscreen` (NEW; replaces NASA Cog Battery) | (depends on access) | ✓ | ✓ | CogScreen-AE FAA-grade |
| `cognitive.pvt_b_lapses` | ✓ | ✓ | ✓ | open-source PVT on commodity laptop |
| `physical.sot5_equilibrium` | — | (?) | ✓ | NeuroCom Equitest CDP USD 50 k+ |
| `psych.resilience_cdrisc` | ✓ | ✓ | ✓ | CD-RISC-25 free for research, 25 items, 5 min |
| `psych.emotional_intelligence` | — | ✓ | ✓ | MSCEIT commercial |
| `psych.mmpi2rf_eid` | — | ✓ | ✓ | requires licensed clinical psychologist |
| `psych.bdi2_baseline` | ✓ | ✓ | ✓ | paper-based, modest fee, 5 min |

Final table will be regenerated from the research output. Until then this table is provisional.

## 4. UI changes — Scenario selector

### 4.1 New type

```ts
// src/types/scenario.ts
export type AccessTier = "minimum" | "medium" | "elite";

export const TIER_LABEL: Record<AccessTier, string> = {
  minimum: "Minimum — low-resource analog program",
  medium: "Medium — well-equipped research center",
  elite: "Elite — real spaceflight / NASA-grade",
};

export const TIER_DESCRIPTION: Record<AccessTier, string> = {
  minimum: "Paper-based tests, free software, commodity laptops. Budget < USD 5 k.",
  medium: "Adds clinical-psychology consultation + commercial test licenses. USD 5–50 k.",
  elite: "Full battery including CDP balance, metabolic cart, sleep lab. > USD 50 k + agency staff.",
};
```

### 4.2 Extend `Criterion` type

```ts
// src/types/criterion.ts
export type Criterion = {
  id: string;
  family: string;
  label: string;
  description: string;
  instrument: string;
  scale: { min: number; max: number };
  higherIsBetter: boolean;
  citations: string[];
  // NEW (scope-expansion-3):
  accessTier: AccessTier[]; // 1+ tiers this test belongs to
};
```

The accessTier field is an **array** because some tests are valid at multiple tiers (e.g. NEO-FFI fits in T1/T2/T3 — same instrument, identical computation, just commodity hardware).

### 4.3 ScenarioSelector component

Lives at `src/ui/wizard/ScenarioSelector.tsx`. Shown at the **top of wizard step 2 (Criteria)**. Renders as a three-button radio group:

```
┌─────────────────────────────────────────────────────────────┐
│ Scenario · accessibility tier                                │
│                                                              │
│ ◉ Minimum    ◯ Medium    ◯ Elite                            │
│                                                              │
│ Low-resource analog program. Paper-based tests, free         │
│ software, commodity laptops. Budget < USD 5 k.               │
│                                                              │
│ N tests shown (of M total) · click 'Medium' or 'Elite' to    │
│ unlock the higher-tier criteria.                             │
└─────────────────────────────────────────────────────────────┘
```

Default tier: `"minimum"`. Tier choice is **persisted in WizardContext** + saved to `DbCandidate` (new field `DbCandidate.accessTier?: AccessTier`).

### 4.4 Wizard step 2 filter

`StepCriteria.tsx` filters `PLACEHOLDER_CRITERIA` by `c.accessTier.includes(currentTier)`. Counts in the status row reflect the filtered count: "3 ok · 1 partial · 1 empty (of 5 tier-1 criteria)".

### 4.5 ScoreBreakdownRadar spoke count

F6 currently shows 12 spokes (all criteria). After tier filtering, F6 reflects ONLY the active-tier criteria — natural fit, no extra logic needed.

### 4.6 CalculationTrace tier mention

The header card of both `MCDACalculationTrace` and `IMMCalculationTrace` gains a small "tier · Minimum/Medium/Elite" chip so the reader knows which battery was used. Caption modules (F1, F6) also reference the tier in their Source line.

### 4.7 Saved simSession audit trail

`SimSession.notes` field (already on the schema) gains a deterministic prefix: `"tier=minimum · "` (or medium/elite). This makes every saved simulation traceable to its tier.

## 5. Computation-integrity guarantees

Diego's directive: "make sure the calculations and computations are correct."

### 5.1 MCDA closed-form sanity check

`tests/engine/mcda.test.ts` asserts the empirical MCDA mean + variance match the closed-form within 2% / 5% over 50 k samples with α = (1, …, 1). **Re-run with the tier-filtered criteria** to confirm: at K=5 (Tier-1 subset) the closed-form moment check must still pass. At K=12 (full set, current) it passed at commit `15f64aa`. The test must be extended to assert correctness at K = T1-count, T2-count, T3-count.

### 5.2 IMM Poisson-Gamma conjugate sanity check (V&V Factor 1)

Iter-3 V&V dossier (`docs/iter3_vv_dossier.md`) marked Factor 1 (Verification) as PARTIAL because the closed-form Poisson-Gamma test was deferred to Task 59. **Scope-expansion-3 includes** adding `tests/risk/poisson_gamma_check.test.ts` with the closed-form sanity check, satisfying Factor 1 fully.

### 5.3 Bayesian conjugate property

The Iter-3 Lognormal-Poisson hierarchical model + the vulnerability multiplier exp(β·z) preserve Poisson conjugacy per spec §3.1 (M18). Verified analytically + by the simulator test suite — no regression risk.

### 5.4 Deterministic seed contract

All tier scenarios use the same seed (`0xC0FFEE`) so byte-identical re-runs are possible. Test: run a sim at each tier with the same seed; the per-condition QTL and CHI mean must change (different criteria → different vulnerability multiplier), but for a fixed tier the answer is reproducible.

## 6. Citations

All citations in `placeholder-criteria.ts` and the tier-rationale table MUST be verified DOIs. The research subagent is required to verify each DOI via `mcp__paper-search.search_crossref` or `mcp__claude_ai_PubMed.get_article_metadata`. Final citation list will be reproduced verbatim in `research/2026-05-19_test_battery_tiers.md` + cross-linked from `placeholder-criteria.ts`.

**No fabrication.** If a DOI cannot be verified, the citation is dropped or the test is removed from the tier.

## 7. Deliverables

| Deliverable | Owner | Status |
|---|---|---|
| Research markdown with verified DOIs + tier table | research subagent (in flight) | RUNNING |
| This spec | controller | DONE (this file) |
| Implementation plan | controller (via `superpowers:writing-plans`) | PENDING |
| `src/types/scenario.ts` + extended `Criterion` type | implementer subagent | PENDING |
| `src/ui/wizard/ScenarioSelector.tsx` | implementer subagent | PENDING |
| `WizardContext` + `DbCandidate.accessTier` wiring | implementer subagent | PENDING |
| `StepCriteria` tier filter | implementer subagent | PENDING |
| Poisson-Gamma conjugate test (V&V Factor 1 fix) | implementer subagent | PENDING |
| MCDA closed-form check at multiple K values | implementer subagent | PENDING |
| CalculationTrace tier chip + caption updates | implementer subagent | PENDING |
| STATUS + V&V dossier update | controller | PENDING |

## 8. Out of scope (for this expansion)

- **Multi-tier sim runs** (running the same candidate at Tier-1 + Tier-2 + Tier-3 to compare uncertainty) — feature, not a blocker. Defer to Iter-4 if Diego asks.
- **Per-tier vulnerability β elicitation** — the T41 hand-elicitation audit (`research/imm_sources/_beta_elicitation_audit.md`) already has condition × predictor cells. Tier-aware β is a stretch goal; v1 uses the same β across tiers (a Tier-1 missing test contributes 0 to the multiplier, identical to Iter-1 behavior).
- **DbDump schema migration** — the `accessTier` field is new on `Candidate`; the migration is a Dexie schema v1 → v2 bump. Defer if Diego's existing dev-seeded data is OK to wipe (it's dev fixtures); otherwise add a v1→v2 upgrade hook.

## 9. Open questions for Diego

1. **Default scenario at new-candidate creation?** Spec says `"minimum"`. Confirm.
2. **Hide higher-tier criteria entirely, or show them disabled with an "elite-only" badge?** Spec leans toward HIDE for clarity; show as faint chips for ambition.
3. **Should saved candidates lock their tier?** A candidate scored at Tier-1 then re-scored at Tier-3 has different criteria entries. Spec leans toward IMMUTABLE per-candidate tier (set at creation); switching tier creates a new candidate.

Defaults will be picked from the recommended option until Diego pushes back.
