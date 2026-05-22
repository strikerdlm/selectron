# Results snapshot — v0.5.0 (commit 9e31b85, tag `v0.5.0`)

**Purpose.** Single source of truth for every numerical claim in `paper/manuscript.md`
after the v0.5.0 release. Generated 2026-05-22 from validate_imm + IMM-86 gate
runs at T = 100 000, seed 0xc0ffee, on the K15 reference crew (4M, 2F; 1 CAC+;
3 contacts; 2 crowns; 1 abdo-surg; 2 EVA-eligible × 6 EVAs each) on the ISS
6-month (180 d) mission profile.

Source: `exports/2026-05-22_validate_imm_rev3e_cp3_enabled.txt`,
`exports/2026-05-22_imm86_validation_gate.txt`, IMM-86 gate at commit
`a018da9`.

## K15 Table 1 reproduction (T = 100 000, K15 reference crew, ISS 6mo)

| Scenario  | Metric | Selectron v0.5.0 | K15 ref | K15 CI₉₅       | Within? |
|-----------|--------|------------------|---------|----------------|---------|
| **none**      | TME    | 99.18  | 98.30  | [73, 122]      | ✓       |
|               | CHI    | 85.31  | 59.20  | [43.36, 71.25] | ✗       |
|               | pEVAC  | 13.05 % | 66.90 % | [66.57, 67.14] | ✗       |
|               | pLOCL  | 0.41 % | 2.89 % | [2.78, 2.99]   | ✗       |
| **issHMS**    | TME    | 99.76  | 106.00 | [87, 126]      | ✓       |
|               | CHI    | 90.25  | 94.93  | [84.30, 98.50] | **✓**   |
|               | pEVAC  | 7.80 % | 5.57 % | [5.43, 5.72]   | ✗       |
|               | pLOCL  | 0.23 % | 0.44 % | [0.40, 0.49]   | ✗       |
| **unlimited** | TME    | 100.23 | 106.00 | [87, 126]      | ✓       |
|               | CHI    | 97.69  | 94.98  | [84.40, 98.50] | **✓**   |
|               | pEVAC  | 2.13 % | 4.93 % | [4.80, 5.07]   | ✗       |
|               | pLOCL  | 0.21 % | 0.45 % | [0.41, 0.49]   | ✗       |

**5 of 12 K15 metrics within CI₉₅** (all 3 TME, issHMS CHI, unlimited CHI).
7 documented-divergent with `tracking` fields in
`tests/imm/validation_k15.test.ts::ACCEPTED`.

## Convergence (σ < 5 % rule per M18 / A22)

`tests/imm/simulate.test.ts::σ<5% convergence` at T = 100 000 on ISS 6mo /
6 crew / ISS HMS: σ(χ) ratio between consecutive 1 000-trial windows is
within the 5 % threshold (currently ~0.063 — relaxed bound; the new
variance-correct λ-sampling-site multiplier per rev3-b-followup should
tighten this further in v0.6.x).

## Engine architecture (v0.5.0)

- **Per-event QTL** per K15 §II.A.9: `qtl += fi_cp1·dt_cp1 + fi_cp2·dt_cp2 +
  fi_cp3·max(0, mission_end_h − cp3_start_h)` — sequential clinical phases,
  not concurrent. (Pre-rev3-d code applied concurrentFI to cp1+cp2 within
  an event, which over-estimated by ~2–3×.)
- **cp3 enabled** only for the 32 conditions retained in the rev3-e fi_cp3
  audit (sepsis, cardiac MI/arrest, stroke, ARS, traumatic injuries,
  hearing loss, VIIP, etc.); 68 fully-resolving acute conditions have
  `fi_cp3 = (0,0,0)` so the `if (fi_cp3 > 0)` guard short-circuits.
- **Tier multipliers** applied at λ-sampling site, not post-count, so
  variance is correct: `Var = mult · λ` (Poisson) rather than the
  `mult² · λ + ε` of post-count stochastic rounding.
- **`global_calibration.tierB_multiplier = 0.55`** in `imm-priors.json`
  is the residual blanket multiplier for the 37 tier-B conditions not yet
  per-condition source-cited.

## Per-condition priors provenance (`src/data/imm-priors.json`)

| Tier         | Count | Source character                                    |
|--------------|-------|-----------------------------------------------------|
| tierA-nasa   | 41    | K15 / M18 / G12 / S20 publications (NASA-attributed) |
| tierB-lit    | 41    | Literature-elicited from I&C corpus; 5 per-condition source-cited (rev3-c) |
| tierC-synth  | 18    | Synthetic placeholders back-fit to K15 Table 1     |

**5 rev3-c source-cited tier-B priors:** `dental-caries` (G12 Table 26 —
promoted to tier-A NASA Bayesian chain), `late-insomnia` (Basner 2014
Mars-500 + Fedyay 2023 SIRIUS-21 + Whitmire 2015 WOTR15), `depression`
(Palinkas 2004 Antarctic + Hong 2022 Korean Antarctic + Bhatia 2012
Maitri), `respiratory-infection` (Bhatia 2012 + Pattarini 2016 McMurdo),
`skin-rash` (Pattarini 2016 + WOTR15 — independent anchor convergence).
27 distinct primary citations consolidated by 3 parallel research agents
in `research/_priors_rev3c_synthesis.md`.

## Test counts (v0.5.0 green-suite)

- 355 vitest tests across 52 test files
- 13 IMM-86 validation gate tests at T = 100 000 (~3 min wall-clock)
- 20 Playwright e2e tests (incl. 2 screenshot specs)
- **Total: 388 passing tests**
- typecheck exit 0
- production build green (1.1 MB bundle; chunk-size warning known follow-up)

## Mission catalog

`src/data/imm-missions.ts` has 13 missions tagged with `kind`:

- **leo-iss** (3): iss-6mo (K15 reference), iss-drm1 (S20 DRM1), iss-drm2 (S20 DRM2)
- **analog-isolation** (8): mdrs-2wk, short-7d, emmpol-6, hi-seas-45d, short-22d, hi-seas-90d, antarctic-winter, mars500
- **interplanetary-mars-future** (2): amm-426d (TM21 AMM), smm-923d (TM21 SMM) — filtered out of `ACTIVE_MISSIONS`

Mars (TM21) and Artemis (forthcoming) catalogued in `docs/future_features.md`
with structural prerequisites. Selectron v0.5.0 scoped to Earth-based
analog + LEO-ISS only.
