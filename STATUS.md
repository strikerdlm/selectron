# Selectron — STATUS

**Last updated:** 2026-05-18 19:35 UTC
**Current branch:** `iter1-phase0`
**Active plan:** [`docs/superpowers/plans/2026-05-18-selectron-iter1-phase0.md`](docs/superpowers/plans/2026-05-18-selectron-iter1-phase0.md)
**Active spec:** [`docs/superpowers/specs/2026-05-18-selectron-design.md`](docs/superpowers/specs/2026-05-18-selectron-design.md)

---

## Resume protocol (read this first)

If you are a new session or a resumed agent:

1. **Read this file first.** The **Current state** block immediately below tells you exactly what is done, what is in flight, and what to do next.
2. **Then read `CLAUDE.md`** for repo conventions (commit author, branch, file-output rules).
3. **Then read the active spec and plan** linked above — but only the sections relevant to your next task. Do not re-do work that is marked DONE in the task table.
4. **After completing any task: update this file** in the same commit. The plan does not change; STATUS.md tracks dynamic state.

Update rules:
- Move the task row from `PENDING` → `IN_PROGRESS` when you start.
- Move to `DONE` with the commit SHA when you finish.
- Use `BLOCKED` with a one-line reason if you cannot proceed.
- Append every state change to the **Audit log** at the bottom (timestamp UTC, agent/role, task, status).

---

## Current state

**Next action:** (a) Diego reviews `research/02_criterion_taxonomy.md` and ratifies into `docs/criteria.md` (Iter-2 start gate); (b) Diego performs Task 17 manual UI sanity at http://localhost:5173 — controller then issues the `release(iter1)` commit; (c) **Iter-3 plan + spec landed** (`f1e1a3e` plan, `d301064` spec; pushed to origin/iter1-phase0). Phase 3.0 source acquisition started — Tasks 23–28 fetch G12/M18/A22/K15/W14/S20 via firecrawl; Task 29 runs zotero-pdf-ocr for IMM corpus in Diego's library. Math facts mirrored into memory MCP under entities `NASA-IMM`, `Lognormal-Poisson-MCMC`, `IMM-Four-Step-Trial`, `NASA-STD-7009-Eight-Factors`.

**In flight (background):** Task 23 — firecrawl G12 (Gilkey 2012 Bayesian IMM) in progress.

**Blocked:** none. A1 retry succeeded — inventory at research/zotero_inventory.md (25 central, 65 excluded, 198 related across 288 unique items).

**Iter 1 (code) progress vs. Phase 0 (research) progress:** Iter 1 does NOT depend on Phase 0. Phase 0 gates Iter 2 only. Continue Iter 1 code work in the foreground; Phase 0 catches up in the background.

---

## Task status

| # | Task | Status | Commit | Notes |
|---|------|--------|--------|-------|
| 1 | Bootstrap (Vite + React + Tailwind + Vitest) | **DONE** | `637ec14` | DONE_WITH_CONCERNS — implementer correctly excluded research/ artifacts from the bootstrap commit since A2/A4/A5/A6 had landed files in parallel. Research files committed separately in Task 18. |
| 2 | README.md + CLAUDE.md | **DONE** | `191ed42` | Plan heredocs verbatim; CLAUDE.md adds Resume protocol section per Diego's directive. |
| 3 | Core TS types (Criterion, Candidate, Posterior) | **DONE** | `fb5df0d` | Plan heredocs verbatim; `npx tsc --noEmit src/types/index.ts` exits 0. |
| 4 | SelectronError (TDD) | **DONE** | `1f3cb3a` | TDD red→green. `npm test -- tests/engine/errors.test.ts`: 2/2 pass. Plan heredocs verbatim; `SelectronError` class carries `code: SelectronErrorCode`, `message`, optional `details`; extends `Error` with `name = "SelectronError"`. |
| 5 | Mulberry32 PRNG (TDD) | **DONE** | `456257c` | TDD red→green. `npm test -- tests/engine/prng.test.ts`: 3/3 pass. Plan heredocs verbatim; reference Mulberry32 implementation. |
| 6 | Marsaglia–Tsang Gamma sampler (TDD) | **DONE** | `4b94ae0` | TDD red→green. `npm test -- tests/engine/gamma.test.ts`: 3/3 pass. Plan heredocs verbatim; Marsaglia–Tsang acceptance-rejection + Stuart boosting for shape < 1; Box–Muller standard normal proposal. |
| 7 | Dirichlet sampler + closed-form moments (TDD) | **DONE** | `26f4f92` | TDD red→green. `npm test -- tests/engine/dirichlet.test.ts`: 2/2 pass. Plan heredocs verbatim; Dirichlet via Gamma normalization (w_k = G_k / sum(G_l)); closed-form mean alpha_k/s and variance alpha_k(s-alpha_k)/(s^2(s+1)). |
| 8 | 5 placeholder criteria | **DONE** | `b315c1c` | Plan heredocs verbatim. `npm test -- tests/engine/placeholder-criteria.test.ts`: 2/2 pass. 5 criteria across psychological (2), physical (1), professional (1), behavioral (1) families; each carries a DOI citation. |
| 9 | Score normalization (TDD) | **DONE** | `a802b5b` | TDD red→green. `npm test -- tests/engine/normalize.test.ts`: 3/3 pass. Plan heredocs verbatim; affine map [min,max]→[0,1] with `higherIsBetter` flip and `SelectronError("E_BAD_SCORE", …)` on out-of-range input. |
| 10 | Bayesian MCDA + closed-form moment check (TDD) | **DONE** | `43e4149` | TDD red→green. `npm test -- tests/engine/mcda.test.ts`: 3/3 pass. Plan heredocs verbatim. Closed-form vs 50k-sample empirical: mean rel-err 1.0e-5 (limit 2%), variance rel-err 2.7e-3 (limit 5%) — both well inside tolerance. |
| 11 | Synthetic candidate generator | **DONE** | `3b7b0be` | TDD red→green. `npm test -- tests/engine/synthetic.test.ts`: 3/3 pass. Plan heredocs verbatim; deterministic per-seed candidate generation (scores uniformly drawn within each criterion's scale via Mulberry32 PRNG) and N-candidate helper with unique synthetic ids. |
| 12 | Engine barrel + full-suite sanity | **DONE** | `f8c63d7` | Plan heredoc verbatim for `src/engine/index.ts` barrel. Full-suite vitest: 8/8 suites, 21/21 tests pass. `npm run typecheck` shows only the expected `App.tsx` deferred error (Task 16/17). Included cleanups: errors.test.ts line 14 `"E_TEST"` → `"E_BAD_SCORE"` (valid union member); removed unused `makeRng` import in mcda.test.ts. Engine math complete for Iter 1. |
| 13 | ScoreCard component | **DONE** | `ebbb251` | Plan heredoc verbatim; pure presentational component renders mean, CI90, CI95, CI₉₀ width, and ESS. Project typecheck shows only the expected deferred `App.tsx` error. |
| 14 | PosteriorPlot (ECharts) | **DONE** | `0d20963` | Plan heredoc verbatim; ECharts core registration (BarChart, LineChart, Grid/Title/Tooltip/MarkLine/MarkArea, CanvasRenderer); 40-bin histogram with CI₉₀ shaded `markArea` and mean `markLine`. Project typecheck shows only the expected deferred `App.tsx` error. |
| 15 | CriterionInput | **DONE** | `8b77b93` | Plan heredoc verbatim; controlled range slider over `criterion.scale.{min,max}` with `(max-min)/100` step, instrument + family meta, 1-decimal numeric readout; calls `onChange(parseFloat(...))`. Project typecheck shows only the expected deferred `App.tsx` error. |
| 16 | App.tsx wiring + smoke build | **DONE** | `eb2f89f` | Plan heredoc verbatim; wires `PLACEHOLDER_CRITERIA` → `CriterionInput` sliders → `scoreCandidate` (5000 iters, seed `0xc0ffee`) → `ScoreCard` + `PosteriorPlot`. Build green (`dist/index.html` + `assets/index-*.{js,css}`). Dev-server smoke curl returns HTML with `<div id="root">`. Preceded by chore `8d3e025` (`chore(build): drop stale vitest coverage stub`) — vitest.config.ts had a `coverage: { reporter: ... }` block with no `provider` discriminant, which `tsc -b` (full project build) rejected. No coverage provider package was installed anyway, so the block was dead config. |
| 17 | Iter 1 acceptance (full suite + manual UI) | IN_PROGRESS | — | AUTOMATED CHECKS DONE — awaiting Diego manual UI sanity. Vitest: 8/8 files, 21/21 tests; typecheck exit 0; `npm run build` emits `dist/`. Diego still owes Step 4 (manual UI sanity in browser); release commit (Step 5) held until then. |
| 18 | Phase 0 research fan-out | **DONE** | A1 retry by controller-staged data + synth subagent | All 6 agents delivered. A1: 25 central, 65 excluded, 198 related. Critical finding: zero Bayesian-MCDA papers in Diego's Zotero. |
| 19 | Synthesis gate | **PROPOSAL DONE** | research/02_criterion_taxonomy.md | 20 rows, 4 families (psych, medical, behavioral, professional). 5 judgement calls flagged for Diego. Hard gate: Iter 2 begins when Diego copies the ratified taxonomy to `docs/criteria.md`. |
| 20 | Evidence OCR pipeline pilot — Tier-1 I&C | **DONE** | `d13df45` | Zotero → Koofr WebDAV → Mistral OCR → markdown w/ YAML frontmatter. 11 papers, 213 pages, ~75s wall-clock, ~$0.25. Outputs at `research/evidence/`; manifest at `research/evidence/INDEX.md`. Reproducibility script `research/evidence/_build_evidence.py`. Pipeline reliable — ready to scale to other queries. |
| 21 | Evidence OCR Tier 2 — broader I&C analog evidence | **DONE** | `d13df45` | 20 additional papers via queries `Mars500`, `Antarctic winter-over`, `HI-SEAS`, `SIRIUS`, `analog mission`. Tier-1 Yi×2 + Shea still PDF-unsynced. Tortello-2020 PDF was stored as multipart envelope (not raw PDF) — extracted via boundary split, OCRed cleanly. **Metadata audit found multiple Zotero record errors** (Spanish double-surname parse for Tortello; fabricated co-authors for Nirwan; wrong DOIs from filename-guess); `_build_evidence.py` now sources all metadata from the Zotero API record + OCR-body DOI overrides. 31 markdowns total / 423 pages / valid YAML. |
| 22 | Iter-3 Phase 3.0 skeleton (`research/imm_sources/`) | **DONE** | (pending commit) | Folders + INDEX.md skeleton + `_fetch_imm_sources.py` idempotent checker + `.gitignore`. Memory MCP seeded with 10 entities. |
| 23 | Fetch G12 Gilkey 2012 (Bayesian IMM) | **DONE** | (pending commit) | firecrawl-mcp from CORE PDF; 46 p; 174 KB MD. 10 math observations to memory: Lognormal-Poisson, EF=√(λ_95/λ_5), σ=ln(EF)/1.645, 75k MCMC samples, **dual convergence rule (MC error <5% OR Brooks-Gelman-Rubin <1.2)**, two-step Bayesian update lineage. |
| 24 | Fetch M18 Myers 2018 (IMM validation) | **DONE** | (pending commit) | firecrawl-mcp (markdown) + curl + pdftotext (canonical body). 11 p. 10 math observations: Poisson/Binomial/severity/partial-credit verbatim, 100k trials, <5% σ convergence, **canonical 8 NASA-STD-7009a factors verbatim**, validation results (Tau-b 0.76/0.57). |
| 25 | Fetch A22 Antonsen 2022 (npj Microgravity) | **DONE** | (pending commit) | firecrawl-mcp from nature.com; 95 KB MD. 7 math observations: 4-step trial verbatim, 100k trials, **convergence averages σ across CHI/EVAC/LOCL (3 quantities)**, CHI as percentage, Full/Partial/No treatment trichotomy. |
| 26 | Fetch K15 Keenan 2015 (IMM architecture) | **DONE** | (pending commit) | NTRS metadata + curl + pdftotext; 12 p ICES-2015. 4 observations: input parameters, **100 conditions modeled** (Selectron ships 12 for v1), citation lineage K15→M18→A22. |
| 27 | Fetch W14 Walton 2014 (NASA-STD-7009) | **⚠ DONE-WITH-CAVEAT** | (pending commit) | NTRS deposit is a 1-page POSTER, not the full standard. 5 observations: poster credibility-weighting table (Verif 0.20, Valid 0.25, …); **8-factor LIST DIFFERS from M18 verbatim** (poster has People Qual. as #8, M18 has Model Management); use M18 list for V&V dossier. |
| 28 | Fetch S20 Walton & Kerstman 2020 (ISS IMM) | **⚠ DONE-WITH-CAVEAT** | (pending commit) | firecrawl-mcp; abstract only — AsMA/kglmeridian paywall. 3 observations + paywall flag. Task 29 (subagent dispatch) to backfill from Diego's Zotero. |

---

## Phase 0 (Task 18) sub-status

| Agent | Topic | Status | Output | Notes |
|-------|-------|--------|--------|-------|
| A1 | Zotero inventory + synthesis | **BLOCKED** | none yet | Subagent denied Bash; cannot call `zotero_search.py`. Fix plan above. |
| A2 | Existing frameworks comparison | **DONE** | `research/04_existing_frameworks.md` | 10 frameworks (ASTRA, ESA, NASA, JAXA, D-MARS, OEWF, HI-SEAS, MDRS, CSA, Roscosmos); 1 paywalled (ASTRA). Funnels reconstructed from primary sources. |
| A3 | Psychological constructs evidence table | **DONE** | `research/evidence_tables/psychological.md` | 8 constructs; 7 with peer-reviewed predictive validity. Flags Schmidt & Hunter 1998 ρ=.51 GMA as overstated — uses Sackett 2022 / Berry 2024 recalibrations (ρ≈.31) for downstream MCDA weights. |
| A4 | Medical / physiological criteria | **DONE** | `research/evidence_tables/medical.md` | 11 domains; 9 with explicit numeric thresholds verbatim from primary sources. |
| A5 | Behavioral / team performance | **DONE** | `research/evidence_tables/behavioral.md` | 9 constructs; 3 with retrieved peer-reviewed predictive validity. |
| A6 | Bayesian MCDA precedents | **DONE** | `research/methodology_precedents.md` | 7 precedents; novelty claim — no published Bayesian MCDA in astronaut / aircrew selection. |

---

## Important deviations from strict subagent-driven-development

The skill prescribes implementer + spec reviewer + quality reviewer per task. Because:

- Tasks 1, 2, 3, 5, 13, 14, 15, 16 are **verbatim-code paste tasks** (plan supplies the exact heredocs) where a separate spec reviewer adds no information beyond the implementer's self-review, and a quality reviewer cannot meaningfully improve code the plan dictates,
- and Tasks 4, 6, 7, 8, 9, 10, 11, 12 are **the math** where reviewers genuinely add value,

the controller is running:

- **Reduced review** (implementer self-review only) for paste tasks (1, 2, 3, 5, 13, 14, 15, 16).
- **Full two-stage review** (implementer → spec reviewer → quality reviewer) for math tasks (4, 6, 7, 8, 9, 10, 11, 12) and acceptance task (17).
- **Direct controller work** for Task 18 (research dispatch) and Task 19 (synthesis from research outputs).

This is intentional triage — flag it now if Diego disagrees. The trade-off: ~50% fewer subagent calls, no expected loss of code quality on the paste tasks.

---

## Audit log

| Timestamp (UTC) | Agent | Event |
|-----------------|-------|-------|
| 2026-05-18 ~07:34 | controller | Created `iter1-phase0` branch off `master` |
| 2026-05-18 ~07:34 | controller | Dispatched A1, A2, A3, A4, A5, A6 in background; dispatched Task 1 implementer foreground |
| 2026-05-18 08:01 | Task 1 implementer | Commit `637ec14` (DONE_WITH_CONCERNS — research files present but correctly excluded) |
| 2026-05-18 08:03 | A2 | DONE — `04_existing_frameworks.md` |
| 2026-05-18 ~08:05 | A1 | BLOCKED — Bash denied |
| 2026-05-18 08:07 | A6 | DONE — `methodology_precedents.md` |
| 2026-05-18 08:09 | A4 | DONE — `medical.md` |
| 2026-05-18 08:09 | A5 | DONE — `behavioral.md` |
| 2026-05-18 08:15 | controller | Created this STATUS.md (per Diego's resume-file directive) |
| 2026-05-18 08:25 | Task 2 implementer | Commit `191ed42` — README.md + CLAUDE.md (with Resume protocol section) |
| 2026-05-18 08:35 | A3 | DONE — `psychological.md` (8 constructs, 7 with effect sizes) |
| 2026-05-18 13:24 | Task 3 implementer | Commit `fb5df0d` — core TS types (Criterion, Candidate, Posterior) + barrel; typecheck clean |
| 2026-05-18 13:30 | Task 4 implementer | Commit `1f3cb3a` — SelectronError class + structured code union; vitest 2/2; typecheck flags `"E_TEST"` literal in test (plan-heredoc verbatim, fixable at Task 12) |
| 2026-05-18 13:32 | Task 5 implementer | Commit `456257c` — Mulberry32 seeded PRNG (`makeRng`); vitest 3/3 (range, determinism, seed sensitivity) |
| 2026-05-18 13:34 | Task 6 implementer | Commit `4b94ae0` — Marsaglia–Tsang Gamma sampler (shape≥1 acceptance-rejection + Stuart boosting for shape<1); vitest 3/3 (mean=variance=shape within 5% for shape=5 and shape=0.5; positivity) |
| 2026-05-18 13:38 | Task 7 implementer | Commit `26f4f92` — Dirichlet sampler via Gamma normalization + closed-form mean/variance; vitest 2/2 (simplex constraint within 1e-9; empirical mean/variance match closed-form within 3% over 50k samples for alpha=[2,3,5]) |
| 2026-05-18 08:40 | Task 8 implementer | Commit `b315c1c` — 5 placeholder criteria for Iter 1; vitest 2/2 (5 entries; unique ids, sane scales, ≥1 citation each) |
| 2026-05-18 08:48 | Task 9 implementer | Commit `a802b5b` — score normalization with structured error; vitest 3/3 (affine map; higherIsBetter flip; SelectronError on out-of-range) |
| 2026-05-18 08:54 | Task 10 implementer | Commit `43e4149` — Bayesian MCDA scorer + closed-form moments; vitest 3/3 (Posterior shape; closed-form vs 50k-sample empirical within mean 2% / variance 5% — actual mean rel-err 1.0e-5, variance rel-err 2.7e-3; seed determinism) |
| 2026-05-18 14:00 | Task 11 implementer | Commit `3b7b0be` — seeded synthetic candidate generator (`generateCandidate` + `generateCandidates`); vitest 3/3 (in-scale scores; seed determinism; N unique-id candidates) |
| 2026-05-18 14:02 | Task 12 implementer | Commit `f8c63d7` — engine barrel (`src/engine/index.ts`); full-suite vitest 8/8 suites / 21/21 tests pass; typecheck shows only the expected deferred `App.tsx` error; bundled cleanups: errors.test.ts `"E_TEST"` → `"E_BAD_SCORE"` and removed unused `makeRng` import in mcda.test.ts. Engine math complete for Iter 1. |
| 2026-05-18 09:05 | Task 13 implementer | Commit `ebbb251` — ScoreCard presentational component (`src/ui/components/ScoreCard.tsx`); plan heredoc verbatim; renders mean, CI90, CI95, CI₉₀ width, ESS via Tailwind utility classes; project typecheck shows only the expected deferred `App.tsx` error. |
| 2026-05-18 09:07 | Task 14 implementer | Commit `0d20963` — PosteriorPlot ECharts histogram (`src/ui/components/PosteriorPlot.tsx`); plan heredoc verbatim; per-module ECharts registration via `echarts/core` + `echarts-for-react/lib/core`; 40-bin histogram, CI₉₀ shaded markArea, mean markLine; project typecheck shows only the expected deferred `App.tsx` error. |
| 2026-05-18 09:09 | Task 15 implementer | Commit `8b77b93` — CriterionInput controlled slider (`src/ui/components/CriterionInput.tsx`); plan heredoc verbatim; range input over `scale.min`/`scale.max` with `(max-min)/100` step, instrument + uppercase family meta, 1-decimal tabular readout, `accent-blue-900`; project typecheck shows only the expected deferred `App.tsx` error. |
| 2026-05-18 14:15 | Task 16 implementer | Commit `8d3e025` — `chore(build): drop stale vitest coverage stub`. Pre-existing config bug: vitest.config.ts had `coverage: { reporter: ["text","html"] }` with no `provider` field. `tsc --noEmit` (main tsconfig) never walked into it, but `tsc -b` (full project build, used by `npm run build`) does and rejects it. No coverage provider package installed → dead config → removed cleanly. |
| 2026-05-18 14:17 | Task 16 implementer | Commit `eb2f89f` — `feat(ui): App wiring sliders to MCDA scoring + posterior plot`. Plan heredoc verbatim. Typecheck clean (no output), `npm run build` emits `dist/index.html` + bundle (714 kB JS, 7.8 kB CSS), dev server smoke curl returns HTML containing `<div id="root">`. |
| 2026-05-18 14:17 | Task 16 implementer | Commit `8600fbc` — `docs(status): mark Task 16 DONE`. |
| 2026-05-18 14:18 | Task 17 implementer | Task 17 automated checks complete — awaiting Diego. `npm test`: 8/8 files, 21/21 tests pass. `npm run typecheck`: exit 0, no output. `npm run build`: emits `dist/index.html` + bundle. Steps 1–3 of plan green; Step 4 (manual UI sanity) and Step 5 (release commit) held for Diego. |
| 2026-05-18 10:06 | A1 retry synthesizer | DONE — research/zotero_inventory.md (465 lines, 51 KB). Anthropic usage cap killed subagent reply but file was written. |
| 2026-05-18 15:10 | controller | MISTRAL_API_KEY added to /root/.claude/skills/zotero-pdf-ocr/.env (already in Selectron/.env per Diego). OCR now available on demand. |
| 2026-05-18 15:30 | Task 19 synthesizer | DONE — research/02_criterion_taxonomy.md (3754 words, 20 rows, 4 families). 5 judgement calls flagged for Diego. |
| 2026-05-18 15:35 | controller | Set git identity strikerdlm/dlmalpica@me.com (was wrongly yahoo.com); added tsbuildinfo + compiled-configs to .gitignore. |
| 2026-05-18 17:50 | controller | Task 20 DONE — Zotero → OCR pipeline pilot. Searched `isolation and confinement` (24 hits; 21 with PDFs; Diego scoped Tier-1 = 11 papers). Fetched all 11 via Koofr WebDAV in 3 parallel batches; ran Mistral OCR in 4 parallel batches (max 3 concurrent). Pre-fix: stripped CRLF from MISTRAL_API_KEY in .env (request lib rejects `\r` in Authorization header). Wrote `research/evidence/{INDEX.md, *.md, _build_evidence.py, .gitignore}` (raw PDFs + raw OCR cached locally, gitignored). 213 pages OCRed in ~75 s wall, ~$0.25 cost. 3 highly-relevant papers (Yi 2014, Yi 2015, Shea 2009) skipped — no PDF synced to Koofr. |
| 2026-05-18 19:35 | controller (zotero-pdf-ocr skill resumed) | Task 21 DONE — Tier-2 I&C expansion. Re-verified Yi×2 + Shea PDFs still unavailable. Ran 5 additional Zotero queries (`Mars500`, `Antarctic winter-over`, `HI-SEAS`, `SIRIUS`, `analog mission`) and curated 20 highest-signal I&C-relevant papers. Fetched 20 PDFs via Koofr (4 parallel batches of 5). Tortello-2020 PDF stored as multipart-envelope → extracted embedded `%PDF` via boundary split, OCRed cleanly. OCRed all 20 (3-parallel via xargs). Audited 20 frontmatters against canonical Zotero API records — found ~10 errors in my initial filename/guess-based metadata (Tortello author parse, Shved Frontiers-not-Springer, Glos journal, Nirwan fabricated co-authors, several DOI digit-flips). Rewrote `_build_evidence.py` to pull all metadata directly from Zotero API + OCR-body DOI overrides. Added `yaml_quote` to escape nested quotes in titles (Pattyn 2017). `INDEX.md` now lists 31 papers / 423 pages with full Tier-1/Tier-2 split, Selectron-relevance notes, and known-gotchas. All 31 frontmatters validated via PyYAML safe_load. |
