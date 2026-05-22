# IMM Priors Rev3 — Re-elicitation Strategy

**Created:** 2026-05-22
**Status:** rev3-a in progress (this session); rev3-b/c deferred to follow-up
**Owner:** Diego
**Reference targets:** K15 Table 1 (ISS 6mo / 6 crew / T=100k)

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

| Phase | Scope | Expected Δ | Status |
|-------|-------|-----------|--------|
| **rev3-a** | Resource-name normalisation (this session) | issHMS pEVAC ↓; CHI(issHMS) ↑; TME unchanged | IN PROGRESS |
| **rev3-b** | Multi-knob incidence calibration | TME → ref across all 3 scenarios; CHI(none) → ref; secondary effect on pEVAC | DEFERRED |
| **rev3-c** | Closed-form per-event p_evac/p_locl rescale | pEVAC(none) → 66.9 %; pLOCL(none) → 2.89 % | DEFERRED |
| **rev3-d** | TM21 AMM/SMM validation gate | Verify generalisation to Mars-class missions | DEFERRED |

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
