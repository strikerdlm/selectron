# Selectron — design spec

**Author:** Diego L. Malpica, MD
**Date:** 2026-05-18
**Status:** Draft (pre-implementation)
**Inspiration source:** Apollonio, Kring, Berry, Sawyer. *ASTRA Framework for Enhancing Human Performance and Safety in Analog Missions: A Pathway to Optimizing Analog Astronaut Selection.* AIAA ASCEND 2026 (paper 2026-3000).

---

## 1. What Selectron is

Selectron is a **single-author research tool plus methodology paper** about analog-astronaut selection. The artifact is a working TypeScript application; the deliverable is a peer-reviewed methodology paper that uses the application's outputs as figures and tables.

The application is a **Bayesian multi-criteria decision-analysis (MCDA) scoring engine** for analog-astronaut applicants, with an interactive UI. Given an applicant's profile across a set of literature-grounded criteria, Selectron returns:

1. A posterior distribution over the applicant's total score (not a point estimate);
2. A ranked candidate list with credible intervals on every position;
3. A select/reject recommendation that is auditable back to the per-criterion contributions;
4. A sensitivity analysis showing how the ranking changes under reasonable perturbations of the elicited weights.

Selectron is **explicitly not**:

- A registry, database, or applicant-tracking system (that is what ASTRA's AAD proposes — Selectron is methodological, not infrastructural).
- A clinical decision-support tool (it does not diagnose, treat, or certify anyone for spaceflight).
- A multi-user platform (no auth, no shared backend, no SaaS).
- A replacement for human judgment in selection panels (it is a defensible input to that judgment).

## 2. Why Bayesian MCDA, and why this paper is publishable

Three properties make Bayesian MCDA a defensible methodological core for this domain:

1. **Honest uncertainty.** Selection panels routinely produce point-estimate rankings that collapse genuine uncertainty into a false ordering. Posterior distributions over the score expose when two candidates are statistically indistinguishable on the available evidence — a result that has real procedural consequences (justify additional assessment, document the tie, randomize within the indifference zone).
2. **Elicited weights with diagnostics.** The criterion weights — which dominate any MCDA — become priors that can be checked against the literature, perturbed in sensitivity analysis, and revised across rounds without invalidating the framework.
3. **Reproducibility.** Every number in the paper is regenerable from the same TypeScript source the application runs on. No "results-and-tool drift" — the tool *is* the methods section.

The methodological contribution is the **end-to-end specification**: how to define criteria from the analog-selection literature, how to elicit priors over weights, how to sample the posterior, and how to interpret the sensitivity analysis in the context of small-sample, single-panel selection. Adjacent fields have published Bayesian MCDA pipelines; this would be the first to publish one for the analog-astronaut domain with a working implementation.

## 3. Architectural decisions (the four locked choices)

| Decision | Choice | Reason |
|---|---|---|
| Audience / scope | Personal research tool + methodology paper | Diego is the operator and primary user; the deliverable is a paper, not a product. Eliminates auth, multi-user, billing, hosting, support. |
| Core function | Scoring & ranking engine with uncertainty | Picked over registry/comparison/criteria-builder options because (a) it is the only option where the methodology *is* the paper, (b) it plays to Diego's prior work on multi-fidelity Bayesian modeling (CGEM, barotrauma). |
| Methodology | Bayesian MCDA + sensitivity analysis | Picked over classical MCDA, hybrid Bayesian+ML surrogate, and evidence-weighted scoring because (a) it is the most defensible posterior treatment with the available evidence, (b) it does not require labeled outcome data, (c) it fits PyMC's mental model even though the implementation is in TypeScript. |
| Compute home | Pure TS/JS, single repo, no Python | Picked over Python-backend and Python-notebook variants because (a) the model is small enough to sample in-browser, (b) zero deployment friction, (c) the paper benefits from a self-contained reproducible artifact. |

## 4. Sequencing — the spiral

The project advances in **four iterations**, each ending in a working artifact and a defensible commit:

### Iteration 1 — End-to-end vertical slice (1 week target)

Goal: a single-page TS/React app that scores **one** synthetic candidate against **5 hardcoded criteria** under a fixed prior, returns a posterior score with a 90% credible interval, and renders it as a one-screen dashboard.

Deliverables:
- `src/engine/sampler.ts` — Metropolis-Hastings sampler with ESS diagnostics
- `src/engine/mcda.ts` — linear additive Bayesian MCDA model
- `src/engine/synthetic.ts` — generator for the demo candidate
- `src/ui/App.tsx` — single page; criterion inputs on the left, posterior plot on the right
- One vitest suite per engine module

Exit criterion: the demo candidate's posterior matches a closed-form check (the linear model has a tractable posterior; we use the closed form as a unit test for the sampler).

### Iteration 2 — Literature-driven criteria + multi-candidate comparison

Goal: replace the 5 hardcoded criteria with the criterion taxonomy ratified at the end of Phase 0 research; add a comparison view that ranks N candidates with credible intervals on rank position.

Deliverables:
- `docs/criteria.md` — ratified criterion taxonomy (output of Phase 0)
- `src/data/criteria.json` — machine-readable criterion definitions
- `src/ui/pages/compare.tsx` — ranked candidate table with credible-interval bars
- Updated vitest suites

Exit criterion: the comparison view correctly identifies pairs of candidates whose posteriors overlap by more than X% as "statistically tied" under a configurable threshold.

### Iteration 3 — Sensitivity analysis + prior elicitation tooling

Goal: add one-at-a-time and Sobol sensitivity indices on the criterion weights; add a UI for Diego to elicit priors interactively (sliders that show the implied prior over weight, with a histogram).

Deliverables:
- `src/engine/sensitivity.ts` — OAT + Sobol
- `src/ui/pages/sensitivity.tsx`
- `src/ui/pages/elicit.tsx`
- A worked elicitation in `docs/methodology.md` (Diego's own weights, derived from the literature)

Exit criterion: the sensitivity analysis identifies the criterion whose weight, when perturbed by ±25%, changes the top-3 ranking the most — and the UI surfaces this as a "robustness flag" next to the ranked list.

### Iteration 4 — Paper draft

Goal: full IMRaD manuscript in `paper/manuscript.md`, all figures regenerable from `src/`, ready for a methodology-friendly venue (candidates: *Aerospace Medicine and Human Performance*, *Acta Astronautica*, *International Journal of Aerospace Psychology*, *Human Factors* — final venue selected via `journal-scout` skill).

## 5. Phase 0 — research agent fan-out

This runs **in parallel with Iteration 1** and produces the literature foundation. Iteration 1 uses 5 hardcoded placeholder criteria intentionally, so the engine and UI can be built and validated against a closed-form check before the criterion taxonomy is locked. Six independent agents, all read-only, fan out in parallel. Each produces exactly one file in `research/` (plus shared assets under `research/sources/`).

| Agent | Surface | Deliverable | Estimated size |
|---|---|---|---|
| A1 — Zotero inventory + synthesis | `zotero-pdf-ocr` skill, recursive on the analog-selection topic cluster in Diego's library | `research/zotero_inventory.md` + per-paper markdowns under `research/sources/` | 10–25 papers |
| A2 — Existing frameworks comparison | `firecrawl`, `WebFetch`: ASTRA/AAD (Apollonio 2026 — already retrieved), ESA / NASA / JAXA medical standards, D-MARS, OEWF (AMADEE), HI-SEAS, Mars Society MDRS | `research/04_existing_frameworks.md` — comparison matrix | ≤ 2 000 words + table |
| A3 — Psychological constructs | `paper-search` (Semantic Scholar / OpenAlex / Google Scholar), `ebsco-unal` (PsycINFO, SPORTDiscus) | `research/evidence_tables/psychological.md` — Big 5 / NEO-PI-R / 16PF / EI / stress-tolerance instruments with effect sizes for isolation tolerance | ≤ 3 000 words |
| A4 — Medical / physiological | PubMed MCP, `paper-search` | `research/evidence_tables/medical.md` — medical screening criteria (cardio, respiratory, neuro, ophthalmologic, dental), with citations to the JAXA, ESA, and NASA standards | ≤ 3 000 words |
| A5 — Behavioral / team performance | `scite`, `paper-search` | `research/evidence_tables/behavioral.md` — BBI, AT&T leadership assessment, NASA's behavioral health and performance (BHP) competencies | ≤ 3 000 words |
| A6 — Bayesian MCDA precedents | `scite`, `paper-search` | `research/methodology_precedents.md` — Bayesian MCDA in personnel selection, aerospace HR, decision analysis | ≤ 2 000 words |

**Synthesis step (human-in-the-loop):** After all six agents finish, Diego ratifies the criterion taxonomy. The output is `docs/criteria.md`, which freezes the data model for Iteration 2. This is a hard gate — **Iteration 2 cannot start** before this file exists and is committed. Iteration 1 proceeds with the 5 hardcoded placeholder criteria regardless of Phase 0 status.

## 6. Data model (preliminary — final shape at end of Phase 0)

The shapes below are placeholders. Phase 0 may add or remove criterion families. The math is invariant to that.

```ts
// src/types/criterion.ts
type Criterion = {
  id: string;                           // "psych.bigfive.conscientiousness"
  family: string;                       // "psychological", "medical", ...
  label: string;                        // "Conscientiousness (Big Five)"
  description: string;                  // 1–2 sentences, citing the instrument
  instrument: string;                   // "NEO-PI-R", "ECG-12", ...
  scale: { min: number; max: number };  // raw score range
  higher_is_better: boolean;
  citations: string[];                  // DOIs
};

// src/types/candidate.ts
type Candidate = {
  id: string;
  alias: string;                        // for blinding in figures
  scores: Record<string, number>;       // criterion id → raw score
  metadata?: Record<string, unknown>;
};

// src/types/posterior.ts
type Posterior = {
  samples: Float64Array;                // length = num_iterations
  ess: number;                          // effective sample size
  mean: number;
  ci90: [number, number];
  ci95: [number, number];
};
```

The Bayesian MCDA model itself is the linear additive form

$$ S_i = \sum_{k} w_k \cdot z(x_{ik}) $$

with $w_k$ drawn from a Dirichlet prior over the simplex (so weights sum to 1 and are interpretable), $x_{ik}$ being candidate $i$'s raw score on criterion $k$, and $z(\cdot)$ a literature-grounded normalization. Each $S_i$ is therefore a posterior distribution, not a number. (Closed form exists for the additive case under Dirichlet weights; we use the sampler so the framework extends to non-additive aggregations later.)

## 7. Error handling and testing posture

- **Math first, UI second.** Every engine module ships with a vitest suite before its UI consumer is written. The sampler is verified against the closed-form posterior of the linear additive model — that test is non-negotiable.
- **No silent NaN.** All engine entry points validate inputs (criterion present, scores in range, weights non-negative) and throw a structured `SelectronError` with an error code. The UI catches and renders the code with a remediation hint.
- **Reproducibility seed.** Every public engine entry point accepts an optional seed. The paper's figures and tables fix the seed; the UI defaults to a fresh seed per session.
- **Audit log.** Every score the UI displays carries a hash of (criterion-set version, candidate scores, seed). The hash appears in screenshots so figures in the paper can be reproduced from the screenshot alone.

## 8. Out of scope (locked, will not be reconsidered in Iter 1–4)

- Multi-user, auth, hosted backend
- Real candidate data ingestion at scale (CSV importer for arbitrary schemas)
- Integration with assessment instruments (NEO-PI-R is computed externally — Selectron only consumes scores)
- Mobile-first UI (desktop browser only, target Chrome / Firefox / Safari latest)
- Internationalization beyond English (the paper is in English; the UI is English-only)
- Persistence across machines (IndexedDB only, no cloud sync)
- Comparison to ML-based selection methods (the paper acknowledges them in Discussion; benchmark is classical MCDA, not ML)

## 9. Open decisions (resolved later, not blocking)

- Final UI library choice (recommend Tailwind + Radix UI, but defer until the Iter 1 wireframe)
- Specific MCMC variant (Metropolis-Hastings is sufficient for the linear additive case; revisit if Iter 2 introduces non-additive aggregations)
- Final criterion taxonomy (output of Phase 0, ratified by Diego)
- Final journal venue (output of `journal-scout` in Iter 4)

## 10. Acceptance for this spec

This document is approved by Diego (or revised on his feedback). On approval, the next step is to invoke the `writing-plans` skill to produce the **implementation plan for Iteration 1 plus the Phase 0 agent fan-out** as a single combined plan. Subsequent iterations get their own plans at the time they begin.
