# Scope expansion 2 — calculation transparency + extended test battery + new missions

**Date:** 2026-05-19
**Trigger:** Diego in-conversation directives ("the literature ... most important tests besides NEO-PI-R, VO2 and team work ... 22 day mission, 7 day mission and 45 day mission ... the app must be able to show the calculations. Reduce the size of the boxes for each crew, the most important thing is the visualization of the calculations ... make fonts brighter almost white but not so ... give priority to the step by step calculation on the webpage, explaining how we got to that probability. This must have educational explanations as well and well cited ... add it to the plan and go go go.")
**Status:** EXECUTED — see commits below
**Scope:** retrofit captured after delivery — Diego pre-authorized via "go go go"

---

## Goals

1. **Calculation transparency.** Show how Selectron arrives at every probability number on the page, with the step-by-step math AND an educational lay-language explanation linked by an arrow.
2. **Extended evidence-based test battery.** Survey the literature for the most important selection tests beyond the original three (NEO-PI-R, VO₂max, BBI) and integrate them into the Criterion catalog so they can be MCDA-scored + IMM-vulnerability-weighted.
3. **New mission durations.** Add 7-day, 22-day, and 45-day analog-mission profiles for short-campaign use cases.
4. **Visual density + brighter chrome.** Smaller candidate cards in a denser grid; brighter text palette closer to white.

## Deliverables

| Deliverable | File / commit | Notes |
|---|---|---|
| **CalculationTrace component** | `src/ui/figures/CalculationTrace.tsx` (`1c0f795`) | Two modes (`MCDA` 4 steps / `IMM` 6 steps). Each step: scientific equation in monospaced bordered box, concrete numbers from THIS session, ↓ arrow connector, lay paragraph, citation source footer. Wired into StepReview (Stage A) + Sim view (Stage B). |
| **Literature survey** | `research/2026-05-19_selection_test_battery_expansion.md` (`5ee9840`) | Lit subagent (paper-search + scite + brave MCP). 7 tests recommended: NASA Cognition Battery, PVT-B, SOT-5 posturography, CD-RISC-25, MSCEIT, MMPI-2-RF EID, BDI-II. Each with peer-reviewed effect size + Bayesian/IMM integration note + lay explanation. |
| **Criterion catalog expansion** | `src/data/placeholder-criteria.ts` (`15f64aa`) | 5 → 12 criteria. The 7 new criteria carry DOI citations and reversed `higherIsBetter` for the tests where the natural scale points wrong (PVT lapses, MMPI EID, BDI-II). |
| **New missions** | `src/data/analog-missions.ts` (`fe2fd83`) | `short-7d` MDRS-1wk, `short-22d` THOR-class, `hi-seas-45d`. Test invariant relaxed (MissionType uniqueness no longer required; multiple campaigns per type allowed). |
| **Brighter palette** | `src/index.css` + `tailwind.config.js` (`fe2fd83`) | `ink-0` #e6e8ec → #f0f4fa (near-white, cool undertone); `ink-1` → #d8dde4. ink-2/3 unchanged from the previous WCAG-AA bump `24c5056`. |
| **Compact CandidateCard** | `src/ui/dashboard/CandidateCard.tsx` (`fe2fd83`) | Outer padding p-5 → p-3, alias text-base → text-sm, metric labels text-[10px] → text-[9px], action row condensed. Dashboard grid 1/2/3-col → 2/3/4/5-col (≈40% more cards per row at lg+). |
| **STATUS catch-up** | `STATUS.md` (`cf4801b`) | Single audit-log entry pointing at this spec + the 4 implementation commits above. |

## CalculationTrace contract

For each step:

```
┌─────────────────────────────────────────────────────────────────┐
│ ① <step title in display font>                                  │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ <scientific equation, monospace, Unicode sub/superscripts>│   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│ APPLIED HERE                                                     │
│ <concrete numbers from THIS session — actual rawValue / mission  │
│  parameters / posterior summary>                                 │
│                                                                  │
│ │ ↓ IN PLAIN ENGLISH                                            │
│ │                                                                │
│ │ <2-3 sentence lay paragraph; no jargon; explains the math      │
│ │  step in terms a non-scientist understands>                    │
│                                                                  │
│ ─────────────────────────────────                                │
│ SOURCE   <human-readable cite>   [reference id]                  │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼ (gradient connector to next step)
```

Visual identity: same `panel` chrome as the rest of the Iter-1 design; signal-amber for active elements (step badge, arrow glyph, citation references). Connectors are 1-px vertical gradients (signal → line) between cards.

## MCDA Trace step inventory (Stage A)

1. Normalize each raw test score → z-score (affine map + higherIsBetter flip)
2. Draw weight vector w from Dirichlet(α₁, …, α_K) with α = 1 (uninformative)
3. Compute weighted total per draw: S^(s) = Σ w_k^(s) · z_k
4. Repeat N times → posterior with mean, CI90, CI95, ESS

## IMM Trace step inventory (Stage B)

1. Look up each condition's base rate from the frozen posterior (`priors.json`)
2. Apply vulnerability multiplier per crew member: λ_{k,i} = λ_k · exp(β_k · z_i)
3. Sample occurrence count: Poisson(λ·t·c) for rate conditions, Binomial(n, p) for event
4. For each event: severity ~ Bernoulli(q); lost-days = (1-τ)·d_untreated + τ·d_treated
5. Sum across conditions → QTL; CHI = 1 − QTL / (t·c)
6. Repeat T trials → CHI posterior + pEarlyTermination at threshold χ*

## Outstanding items

1. **Iter-2 ratification of `docs/criteria.md`** — the 7 new criteria are still in the `placeholder-criteria.ts` file. The Iter-2 plan calls for promotion to a ratified catalog. The lit-survey markdown is the source-of-truth document for that promotion.
2. **`vulnerabilityCriteria` mapping for the new tests** — `src/risk/conditions.ts` currently maps 4 of 12 conditions to vulnerabilityCriteria using the original 5 placeholders. The 8 unpopulated condition rows are an opportunity to wire in the 7 new criteria (especially MMPI-2-RF EID → depression-anxiety, CD-RISC-25 → early-termination-request, NASA Cognition Battery → performance-drop-pvt, SOT-5 → musculoskeletal-injury). Diego ratification gate.
3. **β elicitation for the new criteria** — `research/imm_sources/_beta_elicitation_audit.md` (T41 template) currently lists predictors from the original 5. Diego adds the 7 new tests as candidate predictors during T41 elicitation.
4. **F6 ScoreBreakdownRadar legibility** — radar now has 12 spokes; label collisions possible. Consider rotating labels or only labelling top-N. Defer until Diego flags as needed.

## Commit thread

```
fe2fd83  feat(ui): 3 new missions + brighter palette + compact CandidateCard
5ee9840  research: selection test battery expansion (lit subagent output)
1c0f795  feat(ui): CalculationTrace — step-by-step viewer with educational lay layer
15f64aa  feat(data): expand criteria catalog from 5 to 12
cf4801b  docs(status): catch up — Diego 2026-05-19 scope-expansion-2
```

All on branch `iter1-phase0`, pushed to `origin/iter1-phase0`. 123/123 vitest; 7/7 Playwright; typecheck clean; build green (979 kB JS / 17.4 kB CSS).
