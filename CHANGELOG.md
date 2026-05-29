# Changelog

All notable changes to Selectron are documented here. Format roughly follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), with verbatim
references to the commits and STATUS.md audit-log entries that produced each
entry.

## [0.5.5] — 2026-05-29 — Iter-6 calibration, ASR retarget, manuscript hardening

### Changed
- **Submission target → Advances in Space Research** (Elsevier/COSPAR, subscription
  track, no APC). npj Microgravity dropped (fully OA, APC $3,790 unaffordable).
  Manuscript retitled to lead with the reproducible NASA-IMM mission-risk + HSRB-LxC
  contribution rather than the personnel-selection frame.
- **Prior provenance → 100 % evidence-based:** 34 `tierA-nasa` + 66 `tierB-pymc`
  + 0 `tierC-synth` (final, after community/military pass 4 moved ankle-sprain /
  dental-abscess / UTI from tier-A to PyMC-fitted tier-B). All 66 tier-B fitted via
  PyMC NUTS (R-hat = 1.000, ESS > 2500); elbow/hip/wrist proxy-anchored.
- **K15 reproduction** (post-pass-4, T = 100 000, seed `0xc0ffee`): all 3 TME +
  unlimited CHI (95.3, Δ +0.3) within K15 CI₉₅; issHMS CHI 82.8 (Δ −12.1) marginally
  below CI₉₅ after the evidence-based incidence recalibration; 8 documented-divergent.

### Added
- Iter-6 Python offline calibration pipeline (PyMC NUTS fitter, K15 validator,
  Sobol/Morris SA) + FastAPI Calibration API + Calibration browser view.
- rev3-f severity tuning — 32/32 persistent-impairment conditions from 126 evidence rows.

### Manuscript hardening (2026-05-29)
- Internal-consistency fixes: removed the §2.3 "restored reproduction within CI₉₅ on
  issHMS CHI" overclaim; corrected the §1 "synthetic placeholder" tier description to
  fully-evidence-based; "eight-mission" → seven (matches the F7 generator); reconciled
  §4.4 (8 divergent) vs §4.5 (7 outcome-parameter-driven); corrected the dental-caries
  tier label (`tierB-pymc`, not "promoted to tier-A").
- Honest-cap framing: same-kit-K15-is-yellow disclosure (§3.4); metric-specific
  non-circularity (tier-A reproduces CHI, not TME); Fig 7 T = 25 000 rare-event
  convergence caveat; PyMC-convergence ≠ evidential-pedigree note (§4.4).
- Narrowed the "aircrew" novelty claim and cited Taylan et al. (2024) pilot-MCDM
  precedent; resolved the 2 orphan bibliography entries (now cited).
- Replaced raw `__COMMIT_SHA__` / `__ZENODO_DOI__` template tokens with clean editorial
  placeholders filled at the submission commit.
- Reconciled living docs to the manuscript (README, CITATION.cff, supplementary
  frontmatter, this changelog, superseded npj submission checklist).

## [0.5.0] — 2026-05-22 — Iter-5 IMM Calculator

This is the **Iter-5 release** of Selectron. It ships the NASA-IMM-aligned
probabilistic medical-risk calculator alongside the existing Stage A Bayesian
MCDA pipeline, with the IMM engine validated against the K15 Table 1
reference for the operationally-relevant ISS issHMS + unlimited kit scenarios.

**Headline:** 5 of 12 K15 metrics within K15 CI₉₅ (all 3 TME, issHMS CHI,
unlimited CHI), enforced by the IMM-86 validation gate (commit `a018da9`)
that fails CI if any operational metric exits its accepted bracket.

### Added

- **NASA-IMM probabilistic medical-risk calculator** (`src/imm/`) — 100
  K15-appendix conditions, three-tier prior provenance (40 tier-A NASA, 42
  tier-B literature, 18 tier-C synth back-fit), full Lognormal-Poisson +
  Gamma-Poisson + Beta-Pert + concurrent-FI implementation per K15 §II.A.
- **Crew Composition view** (`src/ui/views/CrewComposition.tsx`) — primary
  user surface: 3-zone layout for crew building, per-criterion Stage A score
  entry with ECharts bell-curve mini-figures, live composite + gate
  aggregation, Web Worker IMM Monte Carlo at T=100k.
- **5 result figures** (I1 Headline, I2 Posterior histograms, I3 Condition
  drivers, I4 Convergence, I5 K15 Validation comparison).
- **NASA HSRB LxC matrix verdict** (`src/imm/lxc.ts`) — IMMOutcome →
  JSC-66705 Rev A likelihood × consequence cell, colour-coded with verbatim
  K15 labels + crew-gate fast-fail (L5×C5=25 RED on any disqualified
  crewmember).
- **Phase 2 UI (IMM-37, IMM-38, IMM-46, IMM-49, IMM-50)**:
  - Dexie v3 schema + `imm_sessions` table with 6 CRUD functions (`createIMMSession`,
    `getIMMSession`, `listIMMSessions`, `updateIMMSession`, `deleteIMMSession`,
    `recentIMMSessionsFor`)
  - K15 Table 1 reproduction badge — colour-coded ✓/✗ per metric, mounts only
    for K15 reference scenarios (iss-6mo × {none / issHMS / unlimited})
  - Quick-load preset crews dropdown — K15 reference, MDRS rotation, HI-SEAS
    6-month, Antarctic 12-person winter-over
  - Session save / load / export-JSON toolbar — Load dropdown always
    visible (chicken-and-egg avoidance); Save + Export gated on outcome
- **IMM-86 K15 reproduction validation gate** (commit `a018da9`,
  `tests/imm/validation_k15.test.ts`) — 13 tests at T=100k locking in the
  rev3-b/c/d/e calibration as a CI contract. Two bracket kinds: K15 CI₉₅
  (5 metrics, strict) and documented-divergent (7 metrics, wider bracket
  + open backlog tracking field).
- **End-to-end browser smoke tests** — `tests/e2e/crew_composition.smoke.spec.ts`
  (4 tests) and `tests/e2e/crew_composition.screenshot.spec.ts` (2 screenshot
  captures).
- **Five preset crews** (`src/data/imm-preset-crews.ts`) — verbatim K15
  reference, MDRS, HI-SEAS, Antarctic configurations.

### Calibration history (priors-rev3 series)

- **rev3-a** (`cdef5e5`) — resource-name normalization closes kit-fallthrough
  coupling; unlimited CHI 83.88 → 92.98.
- **rev3-b** (`1bb2cea`) — `tierB_multiplier = 0.55` diagnostically applied;
  TME within K15 CI₉₅ on all 3 scenarios. **Stochastic-rounding bug** found
  in original Tier-C multiplier path (`Math.round(0.5) = 1` retains event);
  replaced with `floor + Bernoulli(frac)`.
- **rev3-b-followup** (`ce97dda`) — tier multipliers moved from post-count
  to λ-sampling site (variance-correct per `Var = mult · λ`).
- **rev3-c** (`71baf13`) — per-condition source-cited priors for 5 high-impact
  tier-B contributors: `dental-caries` (G12 NASA TM 217227, promoted to
  tier-A), `late-insomnia` (Mars-500 + SIRIUS-21 + WOTR15), `depression`
  (Palinkas 2004 + Hong 2022), `respiratory-infection` (Bhatia 2012 +
  Pattarini 2016), `skin-rash` (Pattarini + WOTR15). 27 primary citations
  consolidated by 3 parallel research agents.
- **rev3-d** (`3ac5480`) — **engine bug fix**: K15 §II.A.9 concurrent-FI was
  mis-applied to within-event sequential cp1+cp2 phases; corrected to
  sum-of-products `fi_cp1·dt_cp1 + fi_cp2·dt_cp2`. cp3 deferred pending
  per-condition prior audit. issHMS CHI Δ -16 → -3.85 (within K15 CI₉₅).
- **rev3-e** (`4521390`) — per-condition `fi_cp3` audit: 68 fully-resolving
  acute conditions zeroed (URTI, GI, MSK sprains, etc.); 32 persistent-
  impairment conditions retained (sepsis, cardiac, stroke, ARS, etc.).
  cp3 re-enabled in QTL. **IMM engine now mathematically complete per
  K15 §II.A.9** (cp1 + cp2 + cp3 sequential phases all correctly charged).

### Architecture decisions

- **2026-05-22 scope decision** — Selectron v1 scoped to Earth-based analog
  + LEO-ISS only. Mars (TM21 AMM/SMM) and Artemis missions catalogued in
  `src/data/imm-missions.ts` with `kind: "*-future"` and filtered out of
  `ACTIVE_MISSIONS`; structural prerequisites documented in
  `docs/future_features.md`.
- **2026-05-22 'none' scenario decision** — K15 'none' (no-kit) values are
  model-construct extrapolations, not observed data; accepted divergence as
  principled limitation rather than chase via blanket untreated-prior
  inflation. See `docs/iter5_scientific_limitations.md` §4.1.

### Documentation

- `docs/iter5_priors_rev3_strategy.md` — full calibration history (§7–§10)
  with per-revision delta tables, K15 reproduction status, and decision logs.
- `docs/iter5_scientific_limitations.md` — 8-section honest catalog of what
  the priors do and do not represent.
- `docs/future_features.md` — 252-line roadmap for Artemis (lunar) + Mars
  (interplanetary) with structural prerequisites.
- `docs/iter3_vv_dossier.md` §5 — IMM Calculator V&V dossier per NASA-STD-7009A
  factors 1–3.
- `docs/iter3_nasa_monte_carlo_audit.md` §7 — IMM Calculator alignment to
  NASA MC canon.
- `research/_priors_rev3c_synthesis.md` — consolidated per-condition
  evidence with 27 primary citations.
- `research/_priors_rev3e_fi_cp3_audit.md` — clinical-judgment classification
  for the 32 persistent-impairment conditions.
- `research/analog_incidence_{antarctic, confined_missions, submarine_iss}.md`
  — three parallel research agents' deliverables.
- NOT-FOR-FLIGHT disclaimer at the top of README.

### Tests (this release)

- 355 vitest tests across 52 test files (engine + UI + DB + integration)
- 13 IMM-86 validation gate tests at T=100k (~3 min)
- 20 Playwright e2e tests (incl. 2 screenshot specs)
- **= 388 passing tests total**
- typecheck exit 0
- production build green (1.1 MB pre-split bundle; chunk-size warning is the
  known follow-up for Phase 3)

### Known issues + open backlog

See README "What's left to do" for the ranked next-iteration backlog:

1. 'none' CHI overshoot (untreated cp1/cp2 priors under-elicited; cp1/cp2 axis)
2. Per-condition source audit for remaining 37 tier-B priors
3. rev3-f (potential) per-condition severity tuning for the 32 persistent-impairment priors
4. IMM Phase 2 UI tail (IMM-39 standalone view, IMM-47 engine toggle, IMM-48 vulnerability mode)
5. Future features: Artemis + Mars + Phase 3 ML

### Commit anchors (release tag `v0.5.0`)

- Engine math + calibration: `cdef5e5`, `1bb2cea`, `ce97dda`, `71baf13`, `3ac5480`, `4521390`
- IMM Calculator UI: `a996fa3` (LxC adapter), `3f2adf4` (Phase 2 batch), `c60002f` (e2e fixes + a11y)
- Validation gate: `a018da9` (IMM-86), `3014105` (e2e smoke + screenshots)
- Scope decision: `7df1a88` (analog scope-down)
- Documentation: `d9f8a5e` ('none' decision), `4bb9126` (rev3-d), `e659a53` (rev3-e), `e1b6692` (Phase 2 UI), `6882c04` (IMM-86)
- CITATION.cff: `c386013` (initial), this commit (v0.5.0 bump)

## [pre-0.5.0] — Iter-1 through Iter-4 (~2026-04 → 2026-05-21)

Prior to Iter-5, Selectron evolved through Iter-1 (vertical slice, 5 placeholder
criteria, Bayesian MCDA core), Iter-2 (12 evidence-grounded criteria + 3-tier
accessibility model), Iter-3 (NASA HSRB LxC verdict + initial IMM Monte Carlo
in `src/risk/`), and Iter-4 (manuscript draft for npj Microgravity). See
`STATUS.md` for the full task-by-task history with commit SHAs.

[0.5.0]: https://github.com/strikerdlm/selectron/releases/tag/v0.5.0
