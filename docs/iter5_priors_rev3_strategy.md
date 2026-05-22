# IMM Priors Rev3 — Re-elicitation Strategy

**Created:** 2026-05-22
**Last updated:** 2026-05-22 ~ 07:00 UTC — rev3-a + rev3-b + rev3-c DONE; rev3-d (TM21 Mars validation) is OUT OF SCOPE per analog-scope-down decision
**Owner:** Diego
**Reference targets:** K15 Table 1 (ISS 6mo / 6 crew / T=100k) — analog-relevant only post-scope-down

---

## 1 · Why rev3 is necessary

Engine fixes landed in commits `717ce98` (duration scaling), `57b7ec3` (resource normalisation), and `6ec801c` (unlimited-kit Proxy spread) corrected three structural bugs. The Beta-Pert outcome priors were re-elicited in rev1 (`25c953b`) and rev2 (`039923b`) against the post-fix engine, but rev2's audit (STATUS.md → IMM-priors-rev2) closed with `DONE_WITH_CONCERNS`: only 3 of 6 smoke gates passed; TME, CHI, and pEVAC(issHMS) were all out-of-spec.

Rev3 is the planned continuation: not a single-pass rewrite, but a phased reduction of the residual gap.

## 2 · Baseline (2026-05-22, pre-rev3-a)

Output: `exports/2026-05-22_validate_imm_rev3_baseline.txt`. T=100 000 trials, seed `0xc0ffee`, K15 reference crew.

| Scenario  | Metric | Engine | K15 ref | Δ | Within CI₉₅? |
|-----------|--------|--------|---------|---|--------------|
| **none**      | TME   | 149.40 | 98.30   | +51.10 | ✗ (+52 %)  |
|               | CHI   |  48.87 | 59.20   | −10.33 | ✗          |
|               | pEVAC |  19.36 % | 66.90 % | −47.54 | ✗ (~3.5× too LOW) |
|               | pLOCL |   0.67 % |  2.89 % |  −2.22 | ✗ (~4× too LOW)   |
| **issHMS**    | TME   | 150.04 | 106.00  | +44.04 | ✗ (+42 %)  |
|               | CHI   |  57.51 | 94.93   | −37.42 | ✗          |
|               | pEVAC |  16.41 % |  5.57 % | +10.84 | ✗ (~3× too HIGH)  |
|               | pLOCL |   0.59 % |  0.44 % |  +0.15 | ✓          |
| **unlimited** | TME   | 151.12 | 106.00  | +45.12 | ✗          |
|               | CHI   |  83.88 | 94.98   | −11.10 | ✗          |
|               | pEVAC |   8.89 % |  4.93 % |  +3.96 | ✗ (~2× too HIGH)  |
|               | pLOCL |   0.54 % |  0.45 % |  +0.09 | ✓          |

TM21 (informational, no formal gate yet):
- AMM 426d: TME 203.7, CHI 57.4, pEVAC 25.8 %, pLOCL 1.00 %
- SMM 923d: TME 394.5, CHI 57.9, pEVAC 48.2 %, pLOCL 2.06 %

## 3 · Diagnosis of the residual gap

The deltas decompose into three independent error modes:

### 3.1 · Incidence is uniformly ~45–50 % too high (TME)

Across all three K15 scenarios, TME is 149–151 versus reference 98 (none) / 106 (issHMS, unlimited). The scenario-invariant excess implies the cause is in per-condition λ values (incidence) before any kit-dependent path is taken.

**Hypotheses** (in descending confidence):
1. Tier-C synthetic priors (18 conditions) have inflated λ from rev1's "tighten Tier-C Gamma" pass; they were never proven against K15 directly.
2. Tier-B literature priors (42 conditions) double-count: many were elicited from terrestrial incidence data without an explicit microgravity-adjustment factor (which K15's iMED applies internally).
3. Tier-A NASA priors (40 conditions) are likely the closest to correct (they trace to M18 / TM21 / S20 numbers); reducing all three tiers uniformly would over-correct these.

**Treatment (rev3-b, deferred):** extend `src/imm/calibration.ts` from its current single-scalar coordinate descent to a multi-knob fit with at least:
- `tierA_incidence_multiplier`
- `tierB_incidence_multiplier`
- `tierC_incidence_multiplier`
- (optional) per-`IMMConditionFamily` multipliers if the residual is family-structured

Fit against K15 TME under all three kit scenarios simultaneously (a single λ-scalar affects TME identically across scenarios).

### 3.2 · Kit fall-through coupling (pEVAC issHMS)

Rev2's audit identified the root cause: when `issHMS` does not cover a condition's `required_resources`, that condition falls back to the untreated outcome path. Raising untreated `p_evac` to match K15 `none`'s 66.90 % therefore inflates `issHMS` pEVAC for any uncovered condition. Rev2 could not break this coupling.

The audit also identified a fixable component: **51 resource-name mismatches** in `imm-priors.json` use generic names (`antibiotic`, `analgesic`, `antiseptic`, `ace-bandage`, `wound-care`, etc.) that the issHMS kit supplies under canonical names (`antibiotic-broad-spectrum`, `analgesic-mild`, `topical-antibiotic`, `bandage-large`, etc.). The `tests/imm/resource_coverage.test.ts` guard was failing as of 2026-05-22.

**Treatment (rev3-a, this session):** apply a deterministic 22-key rename map via `scripts/normalize_resource_names.ts`. Leaves 6 genuinely-uncoverable resources (`imaging`, `hyperbaric-oxygen`, `audiometry`, `blood-products`, `antidote`, `pelvic-floor-trainer`) in place, where RAF=0 is the physically correct outcome. The guard test is updated to whitelist those six.

**Expected delta:** issHMS pEVAC should drop substantially from 16.4 % toward 5.6 % as ~37 conditions move from untreated fall-through to treated path. CHI(issHMS) should rise commensurately. TME unchanged (resource coverage does not affect incidence).

### 3.3 · 'none' scenario p_evac under-elicited

K15 'none' pEVAC = 66.9 % means roughly two-thirds of crews on a 6-month mission without any medical kit would face an EVAC decision. The engine reports 19.4 % — under-elicited by a factor of ~3.5.

This is a pure prior issue, decoupled from the kit-fallthrough coupling: in the 'none' scenario, every condition uses untreated outcomes by definition. So `untreated.p_evac` per condition is simply too low.

Rev2 deliberately did NOT increase untreated.p_evac (it only halved treated.p_evac for B/C/D tiers) because doing so increased issHMS pEVAC via fall-through coupling. With rev3-a's resource-name normalisation removing the fall-through path for the 37 affected conditions, the next phase can safely raise untreated.p_evac.

**Treatment (rev3-c, deferred):** closed-form rescale of per-condition `untreated.p_evac` Beta-Pert distributions. Given the post-rev3-b incidence calibration produces N events per mission, target P(any EVAC) = 66.9 % → per-event p ≈ 1 − (1 − 0.669)^(1/N). Apply the resulting scalar uniformly to all untreated.p_evac.mode values (preserving the min/max ratio so the Beta-Pert shape parameter is unchanged).

## 4 · Phasing

| Phase | Scope | Observed Δ | Status |
|-------|-------|-----------|--------|
| **rev3-a** | Resource-name normalisation | issHMS pEVAC ↓ 16.4 → 12.8 %; unlimited CHI 83.9 → 93.0 | **DONE** `cdef5e5` |
| **rev3-b** | Tier-B incidence multiplier (single-knob; not multi-knob — diagnostic showed tier-B dominates) | TME ✓ across all 3 K15 scenarios; CHI(none) ✓; CHI(unlimited) ✓ | **DONE** (this commit) |
| **rev3-c** | Per-condition source-cited priors for top tier-B contributors (HIGH-confidence only) | 5 conditions updated (dental-caries, late-insomnia, depression, respiratory-infection, skin-rash); 3 source_ref enrichments; tier-B multiplier re-tune | **DONE** (this commit) |
| **rev3-d** | TM21 AMM/SMM validation gate (IMM-87) | Verify generalisation to Mars-class missions | **OUT OF SCOPE** per analog-scope-down 2026-05-22 — see [`future_features.md`](future_features.md) |

## 7 · rev3-b results (T=100 000, post-tierB=0.55)

`exports/2026-05-22_validate_imm_rev3b_tierB055.txt`. The single-knob change:
all conditions with `provenance: "tierB-lit"` (42 conditions, ~65 % of baseline
TME) are now scaled by 0.55 via the new `global_calibration.tierB_multiplier`
field in `imm-priors.json`, auto-loaded by `simulateIMM` when caller's opts
don't override.

| Scenario  | Metric | Before rev3-b | After rev3-b | K15 ref | CI₉₅ | Status |
|-----------|--------|---------------|--------------|---------|------|--------|
| **none**      | TME   | 149.40 | **106.48** |  98.30 | [73, 122] | ✓ |
|               | CHI   |  48.87 |  **64.88** |  59.20 | [43.36, 71.25] | ✓ |
|               | pEVAC |  19.36 % |  13.69 % |  66.90 % | [66.57, 67.14] | ✗ (rev3-c) |
|               | pLOCL |   0.67 % |   0.45 % |   2.89 % | [2.78, 2.99] | ✗ (rev3-c) |
| **issHMS**    | TME   | 150.86 | **107.17** | 106.00 | [87, 126] | ✓ |
|               | CHI   |  60.79 |  75.64 |  94.93 | [84.30, 98.50] | ✗ (severity/coverage; rev3-c?) |
|               | pEVAC |  12.82 % |   8.66 % |   5.57 % | [5.43, 5.72] | ✗ |
|               | pLOCL |   0.31 % |   0.27 % |   0.44 % | [0.40, 0.49] | ✗ |
| **unlimited** | TME   | 152.17 | **107.79** | 106.00 | [87, 126] | ✓ |
|               | CHI   |  92.98 |  **94.88** |  94.98 | [84.40, 98.50] | ✓ (Δ −0.10 — nearly perfect) |
|               | pEVAC |   2.49 % |   2.18 % |   4.93 % | [4.80, 5.07] | ✗ (rev3-c upward) |
|               | pLOCL |   0.26 % |   0.19 % |   0.45 % | [0.41, 0.49] | ✗ (rev3-c upward) |

**5 of 12 K15 metrics now within CI₉₅** (was 1 of 12 post-rev3-a). All 3 TME
metrics ✓; 'none' and 'unlimited' CHI both ✓. The remaining 7 are pEVAC and
pLOCL (all 3 scenarios × 2 metrics, plus issHMS CHI). pEVAC/pLOCL residuals
are systematic (under-elicited untreated path) and address-able by rev3-c
closed-form rescale. issHMS CHI is a third axis: not fixable by incidence
scaling alone — likely needs per-condition severity tuning or further kit
coverage work.

**Stochastic-rounding bug found and fixed:** the original Tier-C multiplier
(T31, commit `cedb2bc`) used `Math.round(count × mult)`. For count=1 (the
dominant per-trial count for most conditions), `Math.round(0.5) = 1` retains
the event entirely, so simple rounding turned a "halve the events" multiplier
into a near-no-op for the count=1 regime. Replaced with stochastic rounding
(`floor + Bernoulli(frac)`) which preserves the expected value exactly. This
was a latent bug in T31 calibration; rev3-b is the first place it materially
affects results.

**TM21 informational** (no formal gate yet — IMM-87 deferred):
- AMM 426d: TME 151.7, CHI 74.12, pEVAC 14.15 %, pLOCL 0.41 % (vs spec band pEVAC 25–40 %, pLOCL 5–12 % — both under, consistent with rev3-c gap)
- SMM 923d: TME 305.2, CHI 72.33, pEVAC 30.05 %, pLOCL 0.95 % (vs pEVAC 40–65 %, pLOCL 15–30 % — pEVAC almost into band; pLOCL well under)

---

## 8 · rev3-c results (per-condition calibration with cited primary sources)

Per [`research/_priors_rev3c_synthesis.md`](../research/_priors_rev3c_synthesis.md). Three parallel research agents produced 27 distinct primary sources across Antarctic / confined-analog / submarine-ISS literature. HIGH-confidence subset applied:

| Condition | Before λ̄/day | After λ̄/day | × | Source |
|-----------|---------------|--------------|---|--------|
| `dental-caries` | 1.37 × 10⁻³ | 2.58 × 10⁻⁵ | 0.019× | G12 Table 26 (NASA TM 217227; submarine + LSAH Bayesian) |
| `late-insomnia` | 2.00 × 10⁻³ | 5.50 × 10⁻⁴ | 0.275× | Mars-500 Basner 2014 + SIRIUS-21 Fedyay 2023 + WOTR15 |
| `depression` | 4.40 × 10⁻⁴ | 2.00 × 10⁻⁴ | 0.455× | Palinkas 2004 + Hong 2022 + Bhatia 2012 |
| `respiratory-infection` | 7.19 × 10⁻³ | 1.43 × 10⁻³ | 0.199× | Bhatia 2012 (Maitri small-crew) + Pattarini 2016 (McMurdo) |
| `skin-rash` | 4.00 × 10⁻³ | 1.37 × 10⁻³ | 0.343× | Pattarini 2016 + WOTR15 (independent convergence) |

Plus source_ref enrichment (no rate change) on `dental-abscess` (G12 Table 22), `headache-co2-induced` (WOTR15 confirmation), and `back-pain-space-adaptation` (KERS12 acute-vs-chronic distinction note).

Tier promotion: `dental-caries` tierB-lit → tierA-nasa (G12 is NASA-published).

**Coverage after rev3-c:** 5 of 42 tier-B conditions now have source-cited per-py rates. The remaining 37 tier-B remain literature-elicited without per-condition validation — the rev3-b blanket `tierB_multiplier` is their fallback. GU/GYN and SMS categories have zero Earth-analog data (see `research/_priors_rev3c_synthesis.md` §1 coverage matrix).

**tier-B multiplier re-tune:** rev3-c lowers 4 tier-B priors (`depression`, `respiratory-infection`, `skin-rash`, plus `late-insomnia` which is tier-A so multiplier doesn't affect it; `dental-caries` was promoted to tier-A and dropped substantially). Expected TME drop with `tierB_multiplier` still at 0.55 is ~9 events. Post-rev3-c `validate_imm` output in `exports/2026-05-22_validate_imm_rev3c_tierB055.txt` decides whether to keep 0.55 or relax toward 1.0.

Each phase commits its priors-rev3 increment + a delta entry to this strategy doc and STATUS.md. Convergence is measured by the K15 reproduction test (`IMM-86`) which gates IMM Phase 2 acceptance (`IMM-51`).

## 5 · Parallelisation analysis

Per-advisor analysis (2026-05-22): re-elicitation is not naturally parallelisable.

- `imm-priors.json` is a single shared file — concurrent agent writes would conflict.
- Each `validate_imm` cycle is ~5–10 min wall-clock; iterations are inherently sequential.
- The only parallelisable phase would be per-condition target rate extraction from primary sources, but K15 / M18 / A22 / TM21 / S20 do not publish per-condition numerical inputs (those live in NASA's internal iMED SQL database). Therefore there is nothing to extract in parallel.

**Conclusion:** rev3-b and rev3-c should each be executed as a single deep-work session, not via parallel agent dispatch.

## 6 · Acceptance gates

- **rev3-a complete when:** `tests/imm/resource_coverage.test.ts` passes AND `validate_imm` shows issHMS pEVAC strictly closer to K15 ref than the baseline 16.41 %.
- **rev3 fully converged when:** all 12 K15 metric/scenario combinations are within K15 CI₉₅ (per IMM-86 test gate).
