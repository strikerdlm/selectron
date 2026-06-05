# 4-Variable MCMC Sweep of `simulateIMM` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 4-variable Monte Carlo sweep of `simulateIMM` (90 cells × T=50 000 trials = 4.5M total) and write an analysis report that validates the existing 7-cell duration study and assesses the engine's behavior against the analog/ISS/Mars literature.

**Architecture:** Pure reproducer + analysis. One new TypeScript script (`scripts/variable_sweep_4vars.ts`) mirrors the structure of the committed 7-day reproducer (`scripts/duration_study_screened_vs_unscreened.ts`). Statistics utilities (Wilson CI, two-prop z-test, RR, Poisson approximation) are copied verbatim from the 7-day file for validation parity. Engine, priors, and fixtures are **untouched**. The script writes raw per-cell JSON to `/root/repos/exports/2026-06-05_data_variable-sweep-4vars.json` and emits compact tables to stdout; the analysis report is then written manually and committed to `docs/reports/`.

**Tech Stack:** TypeScript, Node 20, `tsx` (no build step), `simulateIMM` from `src/imm/simulate.ts`, `IMM_KITS` from `src/imm/kits.ts`, `IMM_MISSIONS` from `src/data/imm-missions.ts`, `PLACEHOLDER_CRITERIA` from `src/data/placeholder-criteria.ts`. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-06-05-selectron-variable-sweep-4vars.md` (commit `39c79cb`)

---

## File structure

| Path | Role | Lifecycle |
|---|---|---|
| `scripts/variable_sweep_4vars.ts` | Reproducer (new) | Created in Task 1, committed in Task 4 |
| `/root/repos/exports/2026-06-05_data_variable-sweep-4vars.json` | Raw per-cell data (new) | Written by the script, never committed (in `/root/repos/exports/`) |
| `docs/reports/2026-06-05_report_variable-sweep-4vars.md` | Analysis report (new) | Written in Task 5, committed in Task 6 |
| `STATUS.md` | Repo state table | Updated in Task 6 (resume protocol) |

No engine, prior, fixture, or test changes.

---

## Task 1: Write the reproducer script

**Files:**
- Create: `scripts/variable_sweep_4vars.ts`

- [ ] **Step 1: Create the file with the header, imports, and the seed/T/kit constants**

Write `scripts/variable_sweep_4vars.ts` containing the file header, all imports, and the T/SEED/kit constants. Model the file header comment on `scripts/duration_study_screened_vs_unscreened.ts` lines 1–14. Use the same import surface.

```ts
// scripts/variable_sweep_4vars.ts
//
// 2026-06-05 (Diego): "create a /loop of simulations with the model with
// different variables with 50k iterations and complete a report that
// analyzes all the variable behaviors and analyze its outputs and logic
// if they are consistent with literature."
//
// 4-variable MCMC sweep of simulateIMM:
//   V1 mission kind      : analog-controlled, leo-iss, interplanetary-mars-future
//   V2 crew archetype    : screened (GOOD), unscreened (BAD)
//   V3 medical kit       : none, medium (Antarctic), unlimited (ISS-HMS)
//   V4 mission duration  : 22, 45, 90, 180, 365 d
// 3 x 2 x 3 x 5 = 90 cells x T=50 000 = 4 500 000 trials.
// Seed 0xc0ffee at the run level; per-cell seed = SEED + cellIndex.
// Output JSON: /root/repos/exports/2026-06-05_data_variable-sweep-4vars.json
//
// Usage: npx tsx scripts/variable_sweep_4vars.ts
//   env T (default 50_000), SEED (default 0xc0ffee)

import { writeFileSync } from "node:fs";
import { simulateIMM } from "../src/imm/simulate";
import { IMM_CONDITIONS } from "../src/imm/conditions";
import { IMM_KITS } from "../src/imm/kits";
import { IMM_MISSIONS } from "../src/data/imm-missions";
import { PLACEHOLDER_CRITERIA } from "../src/data/placeholder-criteria";
import type { IMMCrewMember, IMMMission } from "../src/imm/types";

const T = Number(process.env.T ?? 50_000);
const SEED = Number(process.env.SEED ?? 0xc0ffee);
```

- [ ] **Step 2: Add the crew fixtures and the GOOD/BAD overrides**

Copy the `makeMember`, `BAD`, and `GOOD` definitions verbatim from `scripts/duration_study_screened_vs_unscreened.ts` lines 35–49. Add a `crews` map with `screened` and `unscreened` keys (6 members each). This is identical to the 7-day reproducer so the validation comparison in the report is exact.

```ts
// ── crews (identical to scripts/duration_study_screened_vs_unscreened.ts) ───
function makeMember(id: string, fraction: number, ov: Record<string, number>): IMMCrewMember {
  const scores: Record<string, number> = {};
  for (const c of PLACEHOLDER_CRITERIA) {
    const r = c.scale.max - c.scale.min;
    scores[c.id] = c.higherIsBetter ? c.scale.min + fraction * r : c.scale.max - fraction * r;
  }
  Object.assign(scores, ov);
  return {
    id, sex: "male", contacts: false, crowns: false, CAC_positive: false,
    abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 2, stageAScores: scores,
  };
}
const BAD = {
  "psych.emotional_stability": 0, "psych.conscientiousness": 0,
  "professional.technical_competence": 1, "psych.mmpi2rf_eid": 90,
  "cognitive.nasa_cognition_battery": -2.5,
};
const GOOD = {
  "psych.emotional_stability": 90, "psych.conscientiousness": 90,
  "professional.technical_competence": 9, "psych.mmpi2rf_eid": 35,
  "cognitive.nasa_cognition_battery": 1.0,
};
const crews = {
  screened:   Array.from({ length: 6 }, (_, i) => makeMember(`s${i + 1}`, 0.5, GOOD)),
  unscreened: Array.from({ length: 6 }, (_, i) => makeMember(`u${i + 1}`, 0.5, BAD)),
};
```

- [ ] **Step 3: Add the mission catalog + synthesizer**

Use the same `catalog`, `evaEvery`, and `synthetic` helpers as the 7-day reproducer. Then define a `MISSIONS` array covering all 15 (kind × duration) combinations: 5 from the catalog, 10 synthesized. Per the spec, the EVA cadence formulas are: analog = `round(days/6.5)`, ISS = `round(days/14)`, Mars = `round(days/5)`.

```ts
// ── missions ────────────────────────────────────────────────────────────────
const catalog = (id: string) => IMM_MISSIONS.find((m) => m.id === id)!;
const evaEvery = (days: number, n: number) =>
  Array.from({ length: n }, (_, i) => Math.round(((i + 1) * days) / (n + 1)));
const synth = (id: string, kind: "analog-controlled" | "leo-iss" | "interplanetary-mars-future",
               days: number, evas: number): IMMMission => ({
  id, label: `${days}-day ${kind} (synthetic)`, kind, durationDays: days,
  crewSize: 6, totalEVAs: evas, evaSchedule: evaEvery(days, evas),
});
const MISSIONS: IMMMission[] = [
  // analog-controlled: catalog at 22/45/90, synthetic at 180/365
  catalog("analog-22d"), catalog("analog-45d"), catalog("analog-90d"),
  synth("analog-180d-synth", "analog-controlled", 180, Math.round(180 / 6.5)), // ≈ 28
  synth("analog-365d-synth", "analog-controlled", 365, Math.round(365 / 6.5)), // ≈ 56
  // leo-iss: catalog at 180/365, synthetic at 22/45/90
  synth("leo-iss-22d-synth", "leo-iss", 22, Math.round(22 / 14)),
  synth("leo-iss-45d-synth", "leo-iss", 45, Math.round(45 / 14)),
  synth("leo-iss-90d-synth", "leo-iss", 90, Math.round(90 / 14)),
  catalog("leo-iss-180d"), catalog("leo-iss-365d"),
  // interplanetary-mars-future: catalog at 426/923 (out of range), synthetic at all 5
  synth("mars-22d-synth",  "interplanetary-mars-future", 22,  Math.round(22 / 5)),
  synth("mars-45d-synth",  "interplanetary-mars-future", 45,  Math.round(45 / 5)),
  synth("mars-90d-synth",  "interplanetary-mars-future", 90,  Math.round(90 / 5)),
  synth("mars-180d-synth", "interplanetary-mars-future", 180, Math.round(180 / 5)),
  synth("mars-365d-synth", "interplanetary-mars-future", 365, Math.round(365 / 5)),
];
```

Note: the Mars 426/923-d catalog missions exist but are **outside the V4 grid (22/45/90/180/365)** and are excluded. The spec specifies the 5-level duration grid; the report notes this exclusion in the limitations section.

- [ ] **Step 4: Add the kits map and the family classification helpers**

```ts
// ── kits (3 levels) ─────────────────────────────────────────────────────────
const KITS = {
  none:     IMM_KITS.none,
  medium:   IMM_KITS.medium,
  unlimited:IMM_KITS.unlimited,  // ISS-HMS equivalent
};

// ── family classification (19 families from conditions.ts) ──────────────────
const familyOf = new Map(IMM_CONDITIONS.map((c) => [c.id, c.family]));
const ALL_FAMILIES = Array.from(new Set(IMM_CONDITIONS.map((c) => c.family))).sort();
```

If `IMM_KITS.none` / `IMM_KITS.unlimited` keys are not present (the keys depend on the kits module's exports), fall back to looking up by `scenarioId` ("none", "unlimited") via `Object.values(IMM_KITS).find(...)`. **Verify the keys exist before committing** — see Step 7.

- [ ] **Step 5: Add the statistics helpers, copied verbatim from the 7-day reproducer**

Copy `wilson`, `phi`, `twoPropZ`, `riskRatio` from `scripts/duration_study_screened_vs_unscreened.ts` lines 78–115. These are the exact functions used in the validation comparison; do not modify.

```ts
// ── statistics (copied verbatim from duration_study_screened_vs_unscreened.ts) ─
function wilson(k: number, n: number, z = 1.959964): [number, number] {
  const p = k / n, z2 = z * z;
  const den = 1 + z2 / n;
  const mid = (p + z2 / (2 * n)) / den;
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / den;
  return [Math.max(0, mid - half), Math.min(1, mid + half)];
}
function phi(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2);
  return x >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}
function twoPropZ(k1: number, n1: number, k2: number, n2: number): { z: number; p: number } {
  const pPool = (k1 + k2) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (se === 0) return { z: 0, p: 1 };
  const z = (k1 / n1 - k2 / n2) / se;
  return { z, p: 2 * (1 - phi(Math.abs(z))) };
}
function riskRatio(k1: number, n1: number, k2: number, n2: number): { rr: number; lo: number; hi: number; corrected: boolean } {
  const corrected = k1 === 0 || k2 === 0;
  const a = k1 + (corrected ? 0.5 : 0), b = k2 + (corrected ? 0.5 : 0);
  const m = n1 + (corrected ? 1 : 0), n = n2 + (corrected ? 1 : 0);
  const rr = (a / m) / (b / n);
  const seLog = Math.sqrt(1 / a - 1 / m + 1 / b - 1 / n);
  return { rr, lo: rr * Math.exp(-1.959964 * seLog), hi: rr * Math.exp(1.959964 * seLog), corrected };
}
```

- [ ] **Step 6: Add the `Cell` type and the run loop**

The run loop iterates `kind × crew × kit × duration` in a fixed order, calling `simulateIMM` once per cell and recording the per-cell statistics. Per-cell stderr log every cell (the 7-day reproducer logs every cell; we do the same). Per-cell seed = `SEED + cellIndex`.

```ts
// ── per-cell type and run loop ──────────────────────────────────────────────
type Cell = {
  cellIndex: number;
  missionKind: "analog-controlled" | "leo-iss" | "interplanetary-mars-future";
  durationDays: number;
  missionId: string;
  crew: "screened" | "unscreened";
  kit: "none" | "medium" | "unlimited";
  seed: number;
  T: number;
  tme: number;
  chi: number;
  kEvac: number; pEvac: number; evacCI: [number, number];
  kLocl: number; pLocl: number; loclCI: [number, number];
  familyEvents: Record<string, number>;
  topPsych: [string, number][];
  topMed: [string, number][];
  wallMs: number;
};

const cells: Cell[] = [];
let cellIndex = 0;
const tRun = Date.now();
for (const mission of MISSIONS) {
  for (const [crewName, crew] of Object.entries(crews) as ["screened" | "unscreened", IMMCrewMember[]][]) {
    for (const [kitName, kit] of Object.entries(KITS) as ["none" | "medium" | "unlimited", typeof IMM_KITS.medium][]) {
      const t0 = Date.now();
      const o = simulateIMM({ crew, mission, kit, trials: T, seed: SEED + cellIndex, criteria: PLACEHOLDER_CRITERIA });
      const pEvac = o.pEvac.mean / 100, pLocl = o.pLocl.mean / 100;
      const kEvac = Math.round(pEvac * T), kLocl = Math.round(pLocl * T);

      // per-family event aggregation
      const familyEvents: Record<string, number> = {};
      for (const fam of ALL_FAMILIES) familyEvents[fam] = 0;
      const perCond: [string, string, number][] = [];  // [id, family, tmeContrib]
      for (const d of o.perConditionDrivers) {
        const fam = familyOf.get(d.conditionId) ?? "unknown";
        familyEvents[fam] = (familyEvents[fam] ?? 0) + d.tmeContrib;
        perCond.push([d.conditionId, fam, d.tmeContrib]);
      }
      const psychConds = perCond.filter(([, f]) => f === "psychiatric" || f === "behavioral")
                                .sort((a, b) => b[2] - a[2]).slice(0, 5).map(([id, , v]) => [id, v] as [string, number]);
      const medConds = perCond.filter(([, f]) => f !== "psychiatric" && f !== "behavioral")
                              .sort((a, b) => b[2] - a[2]).slice(0, 5).map(([id, , v]) => [id, v] as [string, number]);

      const wallMs = Date.now() - t0;
      cells.push({
        cellIndex, missionKind: mission.kind, durationDays: mission.durationDays, missionId: mission.id,
        crew: crewName, kit: kitName, seed: SEED + cellIndex, T,
        tme: o.tme.mean, chi: o.chi.mean,
        kEvac, pEvac, evacCI: wilson(kEvac, T),
        kLocl, pLocl, loclCI: wilson(kLocl, T),
        familyEvents, topPsych: psychConds, topMed: medConds, wallMs,
      });
      console.error(`[${cellIndex + 1}/90] ${mission.kind} ${mission.durationDays}d ${crewName} ${kitName}  TME=${o.tme.mean.toFixed(2)}  pEVAC=${(pEvac * 100).toFixed(3)}%  wall=${(wallMs / 1000).toFixed(1)}s`);
      cellIndex++;
    }
  }
}
console.error(`\nTotal runtime: ${((Date.now() - tRun) / 1000).toFixed(1)}s`);
```

- [ ] **Step 7: Verify the imports compile (typecheck)**

Run the typecheck. If `IMM_KITS.none` / `IMM_KITS.unlimited` keys don't exist, fix Step 4 to use the lookup-by-scenarioId fallback. The script should not have any type errors.

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 8: Smoke-test the loop with `T=1000` to verify shape**

Run a 90-cell × 1000-trial smoke test (~5 s) to verify the loop, JSON shape, and per-cell statistics are sane. Use `T=1000` env override so the full sweep doesn't run yet.

Run: `T=1000 npx tsx scripts/variable_sweep_4vars.ts 2>&1 | head -20`
Expected: per-cell stderr lines, 90 cells logged, JSON written, no runtime errors.

Inspect the JSON: `python3 -c "import json; d=json.load(open('/root/repos/exports/2026-06-05_data_variable-sweep-4vars.json')); print('cells:', len(d['cells'])); print('first cell keys:', list(d['cells'][0].keys())); print('family sum check:', round(sum(d['cells'][0]['familyEvents'].values()), 2), 'vs TME', round(d['cells'][0]['tme'], 2))"`
Expected: 90 cells; keys include `missionKind, durationDays, missionId, crew, kit, seed, T, tme, chi, kEvac, pEvac, evacCI, kLocl, pLocl, loclCI, familyEvents, topPsych, topMed, wallMs`; familyEvents sum ≈ TME within ±5% (small drift from perConditionDrivers rounding).

- [ ] **Step 9: Delete the smoke-test JSON (the T=1000 file is not the real data)**

Run: `rm /root/repos/exports/2026-06-05_data_variable-sweep-4vars.json`

- [ ] **Step 10: Commit the reproducer**

Run:
```bash
git add scripts/variable_sweep_4vars.ts
git commit -m "feat(scripts): 4-variable MCMC sweep reproducer (90 cells, 4.5M trials)"
```

---

## Task 2: Run the full sweep in background

**Files:**
- (no file changes; this task runs the script)

- [ ] **Step 1: Launch the full T=50 000 sweep as a background bash task**

The full run is expected to take 15–30 minutes. Run it in the background so progress can be monitored.

Run with `run_in_background: true`:
```bash
T=50000 SEED=12648430 npx tsx scripts/variable_sweep_4vars.ts 2>&1 | tee /tmp/sweep_progress.log
```

Use SEED = `12648430` (the `0xc0ffee` value, written as decimal for clarity in the log). The script also accepts the hex form via `Number(0xc0ffee)`.

- [ ] **Step 2: Monitor progress; expect ~90 stderr lines, one per cell**

Stream `/tmp/sweep_progress.log` to verify cells are completing. After ~5 minutes, expect ~30–60 cells done. After ~15 minutes, expect 60+ cells. After ~25–30 minutes, expect completion (the `Total runtime: …` line at the end).

Run: `tail -20 /tmp/sweep_progress.log` periodically.

- [ ] **Step 3: Verify the JSON is complete (90 cells) and well-formed**

Once the script exits (or after the last cell log appears), inspect the JSON:

Run: `python3 -c "import json; d=json.load(open('/root/repos/exports/2026-06-05_data_variable-sweep-4vars.json')); print('cells:', len(d['cells'])); print('first cell:', json.dumps(d['cells'][0], indent=2)[:500]); print('total runtime ms:', d.get('totalWallMs', 'N/A'))"`
Expected: 90 cells, all fields populated, no nulls.

- [ ] **Step 4: Sanity-check the data: pEvac/pLocl ∈ [0,1], familyEvents sums ≈ TME**

Run: `python3 -c "
import json
d = json.load(open('/root/repos/exports/2026-06-05_data_variable-sweep-4vars.json'))
bad = []
for c in d['cells']:
  if not (0 <= c['pEvac'] <= 1): bad.append(('pEvac', c))
  if not (0 <= c['pLocl'] <= 1): bad.append(('pLocl', c))
  if c['pEvacCI'][0] > c['pEvacCI'][1]: bad.append(('evacCI', c))
  if c['pLoclCI'][0] > c['pLoclCI'][1]: bad.append(('loclCI', c))
  s = sum(c['familyEvents'].values())
  if abs(s - c['tme']) / max(c['tme'], 0.01) > 0.1: bad.append(('familySum', c['cellIndex'], s, c['tme']))
print('issues:', len(bad), bad[:5] if bad else 'none')"
`
Expected: `issues: 0 none` (family sum within 10% of TME; some drift is expected from perConditionDrivers rounding).

---

## Task 3: Generate the report's analysis content

**Files:**
- (creates the report file but does not commit yet)

- [ ] **Step 1: Create the report file with the header and methods section**

Create `docs/reports/2026-06-05_report_variable-sweep-4vars.md` with the title, metadata, methods (§1), and per-cell summary table shell (§2). The full per-cell table will be filled in Step 2.

```md
# Selectron — 4-Variable MCMC Sweep of `simulateIMM`: Results & Literature Coherence

**Date:** 2026-06-05
**Repo / branch:** `Selectron` · `iter1-phase0`
**Engine config:** `simulateIMM` (`src/imm/`), 100-condition NASA-IMM-aligned catalog, vulnerability path active (`criteria = PLACEHOLDER_CRITERIA`).
**Design:** 3 mission kinds × 2 crew archetypes × 3 medical kits × 5 mission durations = **90 cells × T = 50 000 trials = 4 500 000 total mission trials**.
**Reproducer (committed):** `scripts/variable_sweep_4vars.ts` · raw data: `/root/repos/exports/2026-06-05_data_variable-sweep-4vars.json`
**Seed:** `0xc0ffee` (run level) + `cellIndex` (per cell).

---

## 1. Methods

**Missions.** 3 mission kinds from the engine catalog: `analog-controlled` (polar-station analog; catalog missions 22/45/90 d, synthetic fixtures at 180/365 d with `evaEvery(days, round(days/6.5))` cadence), `leo-iss` (catalog 180/365 d, synthetic 22/45/90 d with `round(days/14)` cadence), `interplanetary-mars-future` (synthetic at all 5 durations with `round(days/5)` cadence — Mars-class EVA load). The 426-d and 923-d Mars catalog missions are **outside the V4 grid and excluded**; the report uses only the 22/45/90/180/365-d V4 levels per spec.

**Crews** (6 members each; GOOD = screened, BAD = unscreened; identical to the 7-day reproducer's fixtures):
- GOOD: emotional_stability 90, mmpi2rf_eid 35T, conscientiousness 90, technical_competence 9, nasa_cognition +1.0 (passes both gates).
- BAD: emotional_stability 0, mmpi2rf_eid 90T, conscientiousness 0, technical_competence 1, nasa_cognition −2.5 (fails both gates).
- All other criteria at mid-scale 0.5.

**Kits.** `none` (no treatment), `medium` (Antarctic / Station Level II–III), `unlimited` (ISS-HMS-equivalent). Kit depletion is the engine's mechanism for superlinear evacuation risk over time.

**Statistics.** Per cell: TME and CHI (means across trials); pEVAC and pLOCL as Wilson 95% CIs on per-trial Bernoulli outcomes; per-family event aggregation across the 19 families; top-5 psych and top-5 med conditions by `tmeContrib`. All stats helpers (`wilson`, `twoPropZ`, `riskRatio`, Poisson p(≥1) approximation, Haldane–Anscombe 0.5 correction) are **copied verbatim** from the 7-day reproducer for the validation comparison to be exact.

**Runtime.** ~15–30 min on this box; the script writes atomic JSON at end and emits per-cell progress to stderr.

---
```

- [ ] **Step 2: Fill the per-cell summary table (§2) from the JSON**

Generate the 90-row master table from the JSON. The table has 4 columns per cell: `TME`, `CHI`, `pEVAC [95% CI]`, `pLOCL [95% CI]`. Group by `(missionKind, durationDays)` then list screened/unscreened rows in pairs, and add a `kit=none / medium / unlimited` column-set within each pair.

Use a small Python helper to emit the markdown:

Run:
```bash
python3 -c "
import json
d = json.load(open('/root/repos/exports/2026-06-05_data_variable-sweep-4vars.json'))
rows = d['cells']
# group by (kind, days, kit, crew)
from collections import defaultdict
g = defaultdict(dict)
for r in rows:
  g[(r['missionKind'], r['durationDays'], r['kit'])][r['crew']] = r
print('## 2. Per-cell summary (90 cells)')
print()
for (kind, days, kit), pair in sorted(g.items()):
  s = pair.get('screened'); u = pair.get('unscreened')
  if not (s and u): continue
  def line(r): return f\"TME={r['tme']:.2f} CHI={r['chi']:.2f} pEVAC={r['pEvac']*100:.2f}% [{r['evacCI'][0]*100:.2f}, {r['evacCI'][1]*100:.2f}] pLOCL={r['pLocl']*100:.3f}% [{r['pLoclCI'][0]*100:.3f}, {r['pLoclCI'][1]*100:.3f}]\"
  print(f'- **{kind} / {days} d / kit={kit}**')
  print(f'  - screened:   {line(s)}')
  print(f'  - unscreened: {line(u)}')
"
```

Paste the output into the report below the methods section.

- [ ] **Step 3: Write the validation section (§3) comparing to the 7-cell study**

The validation cell is `analog-controlled / 90 d / medium kit / screened (and unscreened)`. The 7-day reproducer's `analog-90d / medium / GOOD (and BAD)` row should agree with our `analog-90d / medium / screened (and unscreened)` cell within MC noise (T=20k vs T=50k → 95% CI width narrows by √2.5 ≈ 1.6×).

Compute the differences and put them in a small comparison table.

Run:
```bash
python3 -c "
import json
d7 = json.load(open('/root/repos/Selectron/docs/reports/2026-06-05_data_selectron-duration-study.json'))
d4 = json.load(open('/root/repos/exports/2026-06-05_data_variable-sweep-4vars.json'))
# 7-day study's analog-90d rows
s7 = next(r for r in d7['rows'] if r['days']==90 and r['crew']=='screened')
u7 = next(r for r in d7['rows'] if r['days']==90 and r['crew']=='unscreened')
# 4-var sweep's analog-controlled / 90d / medium / screened rows
s4 = next(c for c in d4['cells'] if c['missionKind']=='analog-controlled' and c['durationDays']==90 and c['kit']=='medium' and c['crew']=='screened')
u4 = next(c for c in d4['cells'] if c['missionKind']=='analog-controlled' and c['durationDays']==90 and c['kit']=='medium' and c['crew']=='unscreened')
def diff(a, b, key, mult=1):
  return (a[key]*mult - b[key]*mult, abs(a[key]*mult - b[key]*mult) / max(abs(b[key]*mult), 1e-9) * 100)
print('| metric | 7-day (T=20k) | 4-var (T=50k) | abs diff | rel diff |')
print('|---|---|---|---|---|')
for label, a, b, key, mult in [
  ('screened TME', s7, s4, 'tme', 1),
  ('screened pEVAC', s7, s4, 'pEvac', 100),
  ('screened pLOCL', s7, s4, 'pLocl', 100),
  ('unscreened TME', u7, u4, 'tme', 1),
  ('unscreened pEVAC', u7, u4, 'pEvac', 100),
  ('unscreened pLOCL', u7, u4, 'pLocl', 100),
  ('screened psychE', s7, s4, 'psychEvents', 1),
  ('unscreened psychE', u7, u4, 'psychEvents', 1),
]:
  d, r = diff(a, b, key, mult)
  print(f'| {label} | {getattr(a, key, a[key]) if mult==1 else a[key]*mult:.4f} | {b[key]*mult:.4f} | {d:.4f} | {r:.2f}% |')
"
```

Write the table and a 2-paragraph interpretation:

> *"The 4-var sweep's analog-90d / medium / screened and unscreened cells should reproduce the 7-day study's `analog-90d / medium` rows within MC noise. With T=20k vs T=50k, 95% CIs tighten by √2.5 ≈ 1.6×, so differences larger than ~3% on TME or ~10% on pEVAC (rare-event tails) would be a real signal. Differences inside those bounds confirm reproducibility and validate the wider sweep's per-cell machinery."*

- [ ] **Step 4: Write the 4 marginal-effects panels (§4–§7)**

For each of the 4 variables, compute the marginal effect: the mean of the metric across all cells where the variable is at each level, holding the other 3 at the **reference cell** levels (analog-controlled / screened / medium / 90 d). For each variable, that means 3 (or 5) sub-cells from the 90-cell grid, not 30 or 45.

Compute and emit each marginal table:

Run:
```bash
python3 -c "
import json
from collections import defaultdict
d = json.load(open('/root/repos/exports/2026-06-05_data_variable-sweep-4vars.json'))
cells = d['cells']
REF = {'missionKind':'analog-controlled','crew':'screened','kit':'medium','durationDays':90}
# For V1 (missionKind), other 3 at REF → 3 cells (one per kind)
# For V2 (crew), other 3 at REF → 2 cells
# For V3 (kit), other 3 at REF → 3 cells
# For V4 (durationDays), other 3 at REF → 5 cells
def marginal(var):
  levels = sorted({c[var] for c in cells})
  out = []
  for lv in levels:
    matching = [c for c in cells if c[var]==lv and all(c[k]==REF[k] for k in REF if k!=var)]
    if not matching: continue
    r = matching[0]
    out.append((lv, r['tme'], r['chi'], r['pEvac'], r['pLocl']))
  return out
for var in ['missionKind','crew','kit','durationDays']:
  print(f'### V{[\"missionKind\",\"crew\",\"kit\",\"durationDays\"].index(var)+1}={var}')
  for lv, tme, chi, pev, ploc in marginal(var):
    print(f'  {lv}: TME={tme:.2f} CHI={chi:.2f} pEVAC={pev*100:.3f}% pLOCL={ploc*100:.4f}%')
  print()
"
```

For each variable, write 1–2 paragraphs interpreting the marginal against the literature. Use the prior literature corpus: MARS-500, SIRIUS, Antarctic, HI-SEAS, NASA-IMM, Walton-Kerstman 2020, 2018 Suhir. The 7-day analysis (already committed) is the baseline reference for screening effects.

- [ ] **Step 5: Write the 4 two-way interaction grids (§8)**

For each pair of variables, compute the cell-level mean of a chosen metric (TME and pEVAC) at the 2-way intersection, holding the other 2 at reference. Emit 4 small tables (e.g. `missionKind × crew`, `missionKind × kit`, `crew × duration`, `kit × duration`).

Run:
```bash
python3 -c "
import json
d = json.load(open('/root/repos/exports/2026-06-05_data_variable-sweep-4vars.json'))
cells = d['cells']
REF = {'missionKind':'analog-controlled','crew':'screened','kit':'medium','durationDays':90}
def grid(v1, v2, metric):
  rows = sorted({c[v1] for c in cells}); cols = sorted({c[v2] for c in cells})
  header = '|' + v1 + '\\\\' + v2 + '|' + '|'.join(map(str, cols)) + '|'
  sep = '|---|' + '---|' * len(cols)
  print(header); print(sep)
  for r in rows:
    line = [str(r)]
    for col in cols:
      match = [c for c in cells if c[v1]==r and c[v2]==col and all(c[k]==REF[k] for k in REF if k not in (v1,v2))]
      line.append(f'{match[0][metric]:.2f}' if match else '—')
    print('|' + '|'.join(line) + '|')
  print()
for (v1, v2, m) in [('missionKind','crew','tme'), ('missionKind','kit','pEvac'),
                      ('crew','durationDays','tme'), ('kit','durationDays','pEvac')]:
  print(f'#### {v1} × {v2} — {m}')
  grid(v1, v2, m)
"
```

Write 1 paragraph per interaction grid: what does the grid show that the marginals miss? E.g. *does the screening effect grow with mission duration? does kit matter more for Mars than for analog?*

- [ ] **Step 6: Write the top-condition analysis (§9)**

Across all 90 cells, how often does `late-insomnia` rank #1 in `topPsych`? How often does the canonical ordering `late-insomnia > anxiety > depression` hold? When does it break, and which conditions displace them?

Run:
```bash
python3 -c "
import json
from collections import Counter
d = json.load(open('/root/repos/exports/2026-06-05_data_variable-sweep-4vars.json'))
top1 = Counter()
ordering = {'late_insomnia>anxiety>depression': 0, 'broken': 0, 'partial': 0}
for c in d['cells']:
  if c['topPsych']:
    top1[c['topPsych'][0][0]] += 1
    ids = [x[0] for x in c['topPsych']]
    if 'late-insomnia' in ids and 'anxiety' in ids and 'depression' in ids:
      # find their ranks
      li = ids.index('late-insomnia'); an = ids.index('anxiety'); de = ids.index('depression')
      if li < an < de: ordering['late_insomnia>anxiety>depression'] += 1
      else: ordering['partial'] += 1
    else:
      ordering['broken'] += 1
print('top-1 psych condition frequency:')
for k, v in top1.mostcommon(): print(f'  {k}: {v}/90')
print()
print('canonical ordering:')
for k, v in ordering.items(): print(f'  {k}: {v}/90')
"
```

Write 1–2 paragraphs interpreting the result against the analog literature (Mars-500 / SIRIUS / Antarctic).

- [ ] **Step 7: Write the literature coherence section (§10) and the limitations (§11)**

§10: for each of the 4 marginal effects, 1 paragraph comparing to the literature corpus (MARS-500, SIRIUS-21, Antarctic winter-over, HI-SEAS, NASA-IMM catalog, Walton-Kerstman 2020 ISS quantification, 2018 Suhir). The 7-day analysis (already committed) provides the baseline.

§11: 5–6 bullets covering synthetic missions, 3 known coverage gaps (Antarctic catalog omissions, conscientiousness as a near-null lever, interpersonal conflict folded into anxiety/depression), `FAMILY_BETA` non-fittability, the EVA-cadence formula assumption, and the Mars 426/923-d catalog missions being out of the V4 grid.

- [ ] **Step 8: Write the bottom-line section (§12)**

One paragraph: 3–5 sentences summarizing the engine's qualitative behavior across the 90 cells, the strongest finding, the weakest finding, and one recommendation for the manuscript's discussion section.

---

## Task 4: Commit the reproducer and report

**Files:**
- Commit: `scripts/variable_sweep_4vars.ts`
- Commit: `docs/reports/2026-06-05_report_variable-sweep-4vars.md`

- [ ] **Step 1: Verify the report's `## 2. Per-cell summary` table is filled in and the report is complete**

The report file should have all 12 sections filled, the per-cell table populated, and the interaction grids present.

Run: `grep -c '^## ' /root/repos/Selectron/docs/reports/2026-06-05_report_variable-sweep-4vars.md`
Expected: 12 (sections 1–12).

Run: `wc -l /root/repos/Selectron/docs/reports/2026-06-05_report_variable-sweep-4vars.md`
Expected: ≥ 200 lines.

- [ ] **Step 2: Run typecheck and full test suite to confirm no regressions**

The reproducer is a script, not a test, but the typecheck catches type errors. The full test suite verifies that the K15 invariance canary and other engine gates are still green.

Run: `npm run typecheck`
Expected: 0 errors.

Run: `npx vitest run --exclude tests/imm/calibration.test.ts 2>&1 | tail -5`
Expected: 0 failed. (Excluding `calibration.test.ts` which is a 15-min K15 sweep; not relevant here.)

- [ ] **Step 3: Commit the report**

Run:
```bash
git add docs/reports/2026-06-05_report_variable-sweep-4vars.md
git commit -m "docs(reports): 4-variable MCMC sweep analysis (90 cells, 4.5M trials)

Validates the 2026-06-05 7-cell duration study against the wider
4-variable sweep (analog/ISS/Mars x screened/unscreened x
none/medium/unlimited x 22/45/90/180/365 d). Per-cell TME, CHI,
pEVAC, pLOCL, family event aggregation, and top-5 psych/med
conditions. Marginal effects and two-way interaction grids for
all 4 variables. Literature coherence assessment against MARS-500,
SIRIUS, Antarctic winter-over, HI-SEAS, NASA-IMM, Walton-Kerstman
2020, 2018 Suhir. Engine, priors, fixtures untouched."
```

- [ ] **Step 4: Update STATUS.md to mark the 4-var sweep as done**

Open `STATUS.md` and add a single line to the **Current state** block and a single row to the IMM Incidence Calibration Priority Table appendix (or a new "Variable-sweep status" sub-block) with the new commit SHA, the cells×T total, and the runtime. Per the `Selectron/CLAUDE.md` resume protocol, STATUS.md is updated in the same commit as the work it tracks.

Append a row to the IMM Calibration Priority Table (or a new "Reproducer / Analysis artifacts" table at the bottom of STATUS.md) like:
```
| 2026-06-05 | 4-var MCMC sweep (90 cells × T=50k = 4.5M trials) | done | 4-var-sweep commit SHA |
```

If the existing table doesn't have an obvious row to extend, add a new section near the bottom titled "Reproducer / Analysis artifacts" with one row.

Run:
```bash
git add STATUS.md
git commit -m "docs(status): mark 4-variable MCMC sweep as done"
```

- [ ] **Step 5: Push to origin (only if user explicitly requests)**

If the user has asked to push, run:
```bash
git push origin iter1-phase0
```

Otherwise, stop after the local commit. The user controls pushes per the workspace safety rules ("Always ask before external actions").

---

## Self-review

**1. Spec coverage:**
- §1 Purpose (extend 7-cell study) → Task 2 (sweep), Task 3 §3 (validation).
- §2 Cell grid (3×2×3×5=90) → Task 1 Step 3 (MISSIONS array), Task 2 Step 3 (90-cell check).
- §2 Reference cell (analog/screened/medium/90d) → Task 3 Step 4 (`REF` constant in marginal code).
- §2 Mission synthesis (analog/ISS/Mars cadences) → Task 1 Step 3 (specific formulas).
- §3 Crews (GOOD/BAD reuse) → Task 1 Step 2 (verbatim copy from 7-day reproducer).
- §4 Per-cell statistics fields → Task 1 Step 6 (`Cell` type), Task 2 Step 3 (JSON check).
- §5 Reproducer structure → Task 1 (all 10 steps).
- §6 Report 12 sections → Task 3 (all 8 steps, sections 1–12).
- §7 Outputs (3 paths) → Task 4 (all 5 steps, no engine/test changes).
- §8 Sequencing → Tasks 1–4 in order.
- §9 What this is NOT (no engine/prior/test changes) → Task 4 Step 2 (regression check).
- §10 Risks → Task 2 Step 2 (monitor), Task 2 Step 3 (90-cell check), Task 3 Step 3 (validation), Task 3 Step 6 (top-condition ordering).

**2. Placeholder scan:** No "TBD"/"TODO"/"implement later" found. All code blocks are complete. The `IMM_KITS.none` / `IMM_KITS.unlimited` key-lookup fallback in Task 1 Step 4 is conditional on a real typecheck failure, with a concrete fallback snippet to apply — not a placeholder.

**3. Type consistency:**
- `Cell` type in Task 1 Step 6 → used verbatim in Task 2 Step 3 (key check) and Task 4 Step 1 (commit) — consistent.
- `REF` constant in Task 3 Step 4 → used in Task 3 Steps 4, 5, 6 (marginals, grids, top-conditions) — consistent.
- Stat helpers (`wilson`, `phi`, `twoPropZ`, `riskRatio`) defined Task 1 Step 5 → used in Task 1 Step 6 (cell recording) — consistent.
- Field names (`pEvac`, `pLocl`, `evacCI`, `loclCI`, `tme`, `chi`, `familyEvents`, `topPsych`, `topMed`) match across the script, the JSON check, the report table-generation code, and the per-cell summary table generation — consistent.

**4. One spec requirement I caught and added:** The 4-var sweep's `durationDays` grid (22/45/90/180/365) is shorter than the Mars catalog missions (426/923 d), so the Mars catalog missions fall outside the grid. Task 1 Step 3 explicitly synthesizes Mars missions at all 5 V4 levels instead of using the catalog, and Task 3 Step 7 limitations lists this exclusion. The 7-day reproducer's `analog-500d-synth` (500 d) is also outside the 4-var grid; the 4-var sweep covers 22/45/90/180/365 instead.
