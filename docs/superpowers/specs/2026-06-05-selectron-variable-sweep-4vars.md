# Design — 4-Variable MCMC Sweep of `simulateIMM`

**Date:** 2026-06-05
**Status:** approved (in brainstorm)
**Author:** Chiron (designed with Dr. Malpica)
**Repo / branch:** `Selectron` · `iter1-phase0`

---

## 1. Purpose

Extend the existing 7-cell duration study (`docs/reports/2026-06-05_report_selectron-duration-study-screened-vs-unscreened.md`, T=20k, screened vs unscreened × 7 durations) into a **4-variable, 90-cell, 4.5M-trial sweep** that:

1. Sweeps **mission kind**, **crew archetype**, **medical kit**, and **mission duration** as the four primary variables.
2. Uses **T = 50 000 trials per cell** (2.5× the committed study) to resolve tail events and 2-way interactions.
3. Produces a single analysis report that validates the 7-cell study's findings against the wider sweep, and assesses the model's behavior against the analog/ISS/Mars literature.
4. Adds **no engine, prior, or fixture changes** — pure reproducer + analysis, same boundary discipline as the committed duration reproducer.

## 2. Cell grid

| Variable | Levels | Count |
|---|---|---|
| **V1** mission kind | `analog-controlled`, `leo-iss`, `interplanetary-mars-future` | 3 |
| **V2** crew archetype | `screened` (GOOD), `unscreened` (BAD) | 2 |
| **V3** medical kit | `none`, `medium` (Antarctic), `unlimited` (ISS-HMS) | 3 |
| **V4** mission duration | 22, 45, 90, 180, 365 d | 5 |

**Cell count:** 3 × 2 × 3 × 5 = **90 cells**.
**Trial budget:** 90 × 50 000 = **4 500 000** total trials.
**Wall-clock estimate:** ~15–30 min (per-cell ~1 s short → ~4 s at 365 d Mars).

### Reference cell
`analog-controlled` / `screened` / `medium` / `90d` — matches the committed 7-day study's 90-day row, so the validation comparison is apples-to-apples.

### Mission synthesis
- `analog-controlled` 22 / 45 / 90 d → catalog missions (`analog-22d`, `analog-45d`, `analog-90d`)
- `analog-controlled` 180 / 365 d → **synthetic** fixtures with `evaEvery(days, n)` (n ≈ 1 EVA per 6.5 d, mirroring catalog cadence)
- `leo-iss` 180 / 365 d → catalog missions (`leo-iss-180d`, `leo-iss-365d`)
- `leo-iss` 22 / 45 / 90 d → synthetic fixtures with ISS-class EVA cadence: `evaEvery(days, round(days/14))` (≈ 1 EVA per 14 d, mirroring the catalog's `leo-iss` 180/365-d missions which have 12/20 EVAs over 180/365 d)
- `interplanetary-mars-future` 426 / 923 d → catalog missions
- `interplanetary-mars-future` 22 / 45 / 90 / 180 / 365 d → synthetic fixtures with Mars-class cadence: `evaEvery(days, round(days/5))` (≈ 1 EVA per 5 d, mirroring catalog `interplanetary-mars-future` which has 60/401 EVAs over 426/923 d)

Synthetic missions are tagged `id: "analog-{days}d-synth"` (or `leo-iss-{days}d-synth`, `interplanetary-mars-future-{days}d-synth`) to mark their non-catalog status. Same convention as the 7-day reproducer.

## 3. Crews

Reuse the GOOD/BAD fixtures from the committed 7-day reproducer (`scripts/duration_study_screened_vs_unscreened.ts`):

| Trait | GOOD (screened) | BAD (unscreened) |
|---|---|---|
| `psych.emotional_stability` (0–100 ↑) | 90 | 0 |
| `psych.mmpi2rf_eid` (T-score ↓, gate > 65) | 35 | 90 |
| `psych.conscientiousness` (0–100 ↑) | 90 | 0 |
| `professional.technical_competence` (1–10 ↑) | 9 | 1 |
| `cognitive.nasa_cognition_battery` (z, gate < −2) | +1.0 | −2.5 |
| All other criteria | mid-scale | mid-scale |

GOOD passes both clearance gates. BAD fails both. Crew size 6 per cell, identical members within crew.

## 4. Per-cell statistics (recorded for every cell)

| Field | Type | Source |
|---|---|---|
| `mission` | `{kind, days, crewSize, totalEVAs, id}` | input |
| `crew` | `"screened" \| "unscreened"` | input |
| `kit` | `"none" \| "medium" \| "unlimited"` | input |
| `seed` | int | per-cell = `SEED + cellIndex` (cell 0 = run seed, cell 1 = `SEED + 1`, …) |
| `T` | 50 000 | input |
| `tme` | number | mean across trials |
| `chi` | number | mean across trials |
| `kEvac`, `kLocl` | int | per-trial Bernoulli sum |
| `pEvac`, `pEvacCI` | `[p, lo, hi]` | Wilson 95% CI |
| `pLocl`, `pLoclCI` | `[p, lo, hi]` | Wilson 95% CI |
| `familyEvents` | `{family: eventsPerTrial}` | 19-family aggregation |
| `topPsych` | `[[conditionId, meanEvents], ...]` top 5 | perConditionCounts |
| `topMed` | `[[conditionId, meanEvents], ...]` top 5 | perConditionCounts |
| `wallMs` | int | run timing |

**Statistics utilities** (Wilson CI, two-prop z-test, log-normal RR, Poisson p(≥1) approximation, Haldane–Anscombe correction) are **copied verbatim** from `scripts/duration_study_screened_vs_unscreened.ts` for the validation comparison to be exact.

## 5. Reproducer script — `scripts/variable_sweep_4vars.ts`

Mirror the 7-day reproducer's structure:

```ts
// scripts/variable_sweep_4vars.ts
//
// 4-variable MCMC sweep of simulateIMM: mission kind × crew × kit × duration.
// 90 cells × T=50 000 trials = 4.5M total. Seed 0xc0ffee at the run level.
// Output: JSON to /root/repos/exports/2026-06-05_data_variable-sweep-4vars.json
// + per-cell progress to stdout.

import { writeFileSync } from "node:fs";
import { simulateIMM } from "../src/imm/simulate";
import { IMM_KITS } from "../src/imm/kits";
import { IMM_MISSIONS } from "../src/data/imm-missions";
import { PLACEHOLDER_CRITERIA } from "../src/data/placeholder-criteria";
// (stats helpers copied verbatim from the 7-day reproducer)
```

**Run pattern:** single sequential loop, T=50k per cell, atomic JSON write at end. Per-cell progress line every 10 cells. Per-cell stderr timing so runtime can be monitored.

**Usage:**
```bash
npx tsx scripts/variable_sweep_4vars.ts
# env T (default 50_000), SEED (default 0xc0ffee)
```

**Background execution** with `run_in_background: true` and `Monitor` to stream progress; final report is written after the run completes (or partially completes — partial JSON is still written before failure).

**No engine modifications.** No new tests required (the reproducer is itself the validation). The K15 invariance canary is not affected (engine untouched).

## 6. Report — `docs/reports/2026-06-05_report_variable-sweep-4vars.md`

| § | Section | Content |
|---|---|---|
| 1 | Methods | cell grid, T, seed, software versions, runtime |
| 2 | Per-cell summary table | master matrix of TME, CHI, pEVAC, pLOCL for all 90 cells |
| 3 | Validation vs the 7-cell study | cells matching the 7-day reproducer's configuration, expected to agree within MC noise (T=20k vs T=50k → ~1.4× tighter CIs) |
| 4 | Marginal effect — V1 mission kind | TME/CHI/pEVAC/pLOCL by mission kind (other 3 at reference) |
| 5 | Marginal effect — V2 crew archetype | screening effect (BAD/GOOD ratio) across the 90 cells |
| 6 | Marginal effect — V3 medical kit | kit effect on evacuation tail and TME |
| 7 | Marginal effect — V4 mission duration | TME/CHI/pEVAC/pLOCL by duration; superlinearity check |
| 8 | Two-way interactions (4 grids) | mission × crew, mission × kit, crew × duration, kit × duration |
| 9 | Top-condition analysis | does late-insomnia > anxiety > depression hold across all 90 cells? Any cell where the ordering breaks? |
| 10 | Literature coherence | per marginal effect: MARS-500, SIRIUS, Antarctic, HI-SEAS, NASA-IMM, Walton-Kerstman 2020, 2018 Suhir |
| 11 | Limitations | synthetic missions, 3 known coverage gaps, FAMILY_BETA dependence, evaSchedule formula |
| 12 | Bottom line | one paragraph |

Sections 4–8 are the analytical core. Sections 10–11 are the literature-consistency check. The structure mirrors the 7-day study's analysis pattern but with 4 marginal panels + 4 interaction grids instead of 1 duration sweep.

## 7. Outputs

| Path | Format | Purpose |
|---|---|---|
| `/root/repos/exports/2026-06-05_data_variable-sweep-4vars.json` | JSON (atomic write) | Raw per-cell data |
| `docs/reports/2026-06-05_report_variable-sweep-4vars.md` | Markdown | Analysis report |
| `scripts/variable_sweep_4vars.ts` | TypeScript | Reproducer (committed) |

## 8. Sequencing

1. Write `scripts/variable_sweep_4vars.ts` (estimated 200–250 lines, modeled on the 7-day reproducer).
2. Smoke-test with `T=1000` × 90 cells (90 000 trials, ~5 s) to verify the loop, JSON shape, and per-cell statistics.
3. Run the full sweep at T=50 000 in background, monitor progress, wait for completion.
4. Verify the JSON: 90 cells, no missing fields, pEvac/pLocl within 0–1, familyEvents sums ≈ TME.
5. Write the analysis report (sections 1–12).
6. Validate the report against the 7-day study's numbers.
7. Commit reproducer + report + status update.

## 9. What this is NOT

- **Not** an attempt to refit priors, modify the engine, or add tests. Engine surface is unchanged.
- **Not** an attempt to fit FAMILY_BETA. The β values stay expert-elicited and the report continues to disclose this.
- **Not** a manuscript draft. The manuscript is being prepared separately for ASR submission; this is a research artifact supporting the discussion section.
- **Not** a real analog mission. The model is a planning tool; absolute magnitudes are conservative, qualitative behavior is the focus.

## 10. Risks

- **Runtime exceeds estimate** if 365-d Mars cells are slower than projected. Mitigation: per-cell progress lines, partial JSON write on graceful shutdown (Ctrl-C handler).
- **Validation comparison fails** if the 7-day study's 90-day row doesn't match within MC noise. Mitigation: T=20k → T=50k CIs tighten by √2.5 ≈ 1.6×, so 95% CI overlap is expected. If validation fails, the report discusses it as a separate finding.
- **Top-condition ordering breaks in some cell** — this is a feature, not a bug. The report documents any cell where the 7-day study's "late-insomnia > anxiety > depression" ordering fails, and interprets it against the literature.
- **Synthetic 180/365-d analog missions produce unrealistic results** — flagged in the limitations section; the user can drop those cells in a follow-up if needed.
