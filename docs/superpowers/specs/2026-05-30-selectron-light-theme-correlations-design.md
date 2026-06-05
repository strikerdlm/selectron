# Selectron — Light Theme · +2pt Type Scale · Correlation Analysis Tab

**Design spec** · 2026-05-30 · author: Diego Malpica MD (with AI coding assistance)
**Status:** proposed → awaiting ratification
**Related:** `CLAUDE.md`, `STATUS.md`, `src/ui/figures/theme.ts`, `src/imm/simulate.ts`

---

## 1. Context & motivation

Selectron's frontend is a working Bayesian-MCDA + mission-risk tool whose figures are
also the **manuscript figures** for the Advances in Space Research (ASR) submission.
The submission is the active priority; engineering is otherwise complete.

Diego wants the frontend polished for a **Q1 journal website** companion:

1. A **light UI option** (the app is currently dark-only).
2. The overall type **~2pt larger**.
3. Additional **ECharts visualizations that show correlations and >2 axes** of the data,
   "polished to display those additional correlations visually."
4. **Tests.**

This spec covers all four. It is deliberately scoped to **not disturb the locked manuscript
figures** (F1–F7 + `PaperF6IMM`/`PaperF7IMM`) or their deterministic Playwright snapshots
while the paper is in submission.

---

## 2. Goals

- G1 — Light/dark theme: dark stays default; a header toggle switches to light; the choice
  persists (localStorage) and applies pre-mount (no flash). Both chrome **and the new
  Analysis figures** adapt.
- G2 — Type scale uniformly ~2px larger across chrome and charts, behind one tunable knob.
- G3 — A dedicated **Analysis** tab presenting **five** journal-grade multivariate figures:
  parallel coordinates, multi-dimensional risk bubble scatter, scatterplot matrix (SPLOM),
  criterion-correlation heatmap, and criterion×condition-family **vulnerability-coupling**
  heatmap.
- G4 — Correlations are computed on a statistically respectable N; the figures never render
  empty on the showcase; N is labeled in every caption.
- G5 — Tests: math-before-UI vitest suites for all new data-prep; render-smoke per figure;
  a theme-toggle test; manuscript-snapshot regression check.

## 3. Non-goals / out of scope (clean follow-ups)

- N1 — Making the **existing working-view charts** (Sim / Dashboard / Crew: RiskHistogram,
  ScoreBreakdownRadar, IMM\* figures) theme-aware for crisp **dark mode**. They are
  light-native by design; light mode improves them for free, dark mode keeps today's
  accepted appearance. Retrofitting them is a separate, snapshot-re-baselining task.
- N2 — Changing any manuscript figure, caption, or Playwright baseline.
- N3 — New criteria taxonomy or engine/priors changes. The Analysis tab is read-only over
  existing data (`PLACEHOLDER_CRITERIA`, `IMM_CONDITIONS`, `imm-priors.json`).

## 4. Approach decision

Three options for how far theming reaches into existing charts were considered:

| | Approach | Manuscript-snapshot risk | Effort | Dark-mode result |
|---|---|---|---|---|
| **A ✅ chosen** | New theme infra consumed **only by the 5 new Analysis figures**; existing figures untouched | None (no shared-figure edits) | Low | Analysis tab flawless both themes; working views = today |
| B | A + retrofit ~12 existing figures to be theme-aware | Medium (re-baseline) | High | Working-view charts also crisp-dark |
| C | Toggle themes chrome only; charts always light-carded | None | Lowest | Charts never go dark |

**Chosen: A.** The Analysis tab *is* the journal showcase and will be perfect in both
themes; the working views keep their accepted appearance. B is recorded as the N1
follow-up.

---

## 5. Architecture

### 5.1 Theme system — RGB-channel CSS variables

**Why channel vars (not hex):** a grep found **77 call-sites** using Tailwind opacity
modifiers on custom colors (`bg-signal/10`, `border-line/40`, `bg-go/15`, `border-ink-3/50`,
…). Tailwind can only apply `/<alpha>` when the color is defined with the `<alpha-value>`
channel form. Therefore CSS variables hold **space-separated RGB channels** and
`tailwind.config.js` consumes them as `rgb(var(--x) / <alpha-value>)`.

(Decision rule from review: "use channel vars only if the grep finds real opacity-modifier
usage." It found 77 → channel vars are required.)

**`src/index.css`** — `:root` holds the dark channels (default); `:root[data-theme="light"]`
overrides them. Direct `var(--x)` color usages in this file (22 of them) become
`rgb(var(--x))`. `--signal-dim` becomes a derived color value `rgb(var(--signal) / 0.13)`.
The body dot-grid texture color becomes `--grid-dot` (white in dark, faint near-black in
light) consumed as `rgb(var(--grid-dot) / 0.05)`.

**Palette** (channels; hex in parentheses) — light values contrast-targeted to ≥4.5:1 for
text on `bg-1`:

| var | dark | light |
|---|---|---|
| `--bg-0` page | `8 9 10` (#08090a) | `247 248 250` (#f7f8fa) |
| `--bg-1` panel | `12 13 15` (#0c0d0f) | `255 255 255` (#ffffff) |
| `--bg-2` raised | `19 21 23` (#131517) | `238 241 245` (#eef1f5) |
| `--line` | `31 34 38` (#1f2226) | `216 222 230` (#d8dee6) |
| `--line-2` | `42 46 52` (#2a2e34) | `195 204 214` (#c3ccd6) |
| `--ink-0` | `240 244 250` (#f0f4fa) | `12 15 20` (#0c0f14) |
| `--ink-1` | `216 221 228` (#d8dde4) | `43 50 60` (#2b323c) |
| `--ink-2` | `176 182 189` (#b0b6bd) | `86 95 107` (#565f6b) |
| `--ink-3` | `138 143 150` (#8a8f96) | `100 108 119` (#646c77) |
| `--signal` | `245 181 65` (#f5b541) | `165 104 0` (#a56800) |
| `--signal-bright` | `255 212 121` (#ffd479) | `205 131 18` (#cd8312) |
| `--go` | `86 214 160` (#56d6a0) | `15 122 82` (#0f7a52) |
| `--warn` | `255 107 94` (#ff6b5e) | `194 56 31` (#c2381f) |
| `--grid-dot` | `255 255 255` | `12 15 20` |

`tailwind.config.js` colors map every entry to `rgb(var(--x) / <alpha-value>)`. **No
component className changes** are required — every existing `bg-bg-1`, `text-ink-2`,
`border-line`, `bg-signal/10` re-colors automatically when `data-theme` flips.

**Toggle + persistence + no-FOUC:**
- `src/ui/theme/useTheme.ts` — hook reading `localStorage["selectron-theme"]` (default
  `"dark"`), writing `document.documentElement.dataset.theme` and `style.colorScheme`,
  exposing `{ theme, toggle }`.
- `index.html` — small inline `<script>` before the module script applies the stored theme
  to `<html>` pre-mount (set `data-theme`, remove the hard-coded `<meta color-scheme>` so the
  script controls it).
- Header gets a mono-styled sun/moon toggle button (next to the live/utc cluster).

### 5.2 ECharts theme-awareness (new figures only)

- Register one **new** theme `selectron-dark` (light text `#d8dde4`, title `#f0f4fa`,
  axisLabel `#9aa3ad`, axisLine `#3a4048`, dashed splitLine `#262b31`, tooltip bg `#08090a`
  text `#f0f4fa`, same Okabe-Ito categorical palette + Wong sequential visualMap). The
  existing `selectron-nature` (`NATURE_THEME_NAME`) is **unchanged** and serves as the
  light theme for the new figures.
- `src/ui/figures/useFigureTheme.ts` — returns `{ themeName, tokens }` for the **active UI
  theme**: `themeName` is `NATURE_THEME_NAME` (light) or `"selectron-dark"`; `tokens` is a
  small object (`label`, `axisLine`, `splitLine`, `tooltipBg`, `tooltipText`, diverging +
  sequential colormap arrays) used for the per-figure inline colors the registered theme
  can't cover (heatmap `visualMap`, parallel-axis name colors, etc.). Driven by the same
  `data-theme` source as `useTheme`.
- The five new figures consume `useFigureTheme`. **No existing figure imports it.** Paper
  figures (`PaperF6IMM`/`PaperF7IMM`) and the `?testFigure` harness are not touched and keep
  rendering on `selectron-nature` / white cards → manuscript snapshots are byte-stable.

### 5.3 Type scale +2pt

Two coordinated, reversible edits behind one knob (default **+2px**, tunable):

1. `tailwind.config.js` → `theme.extend.fontSize` overrides each named size +2px
   (`xs 12→14`, `sm 14→16`, `base 16→18`, `lg 18→20`, `xl 20→22`, `2xl 24→26`).
2. Hard-coded `text-[Npx]` literals (~280 across src) bumped +2px via **ordered**
   global replace **largest→smallest** (`16→18, 14→16, 13→15, 12→14, 11→13, 10→12, 9→11,
   8→10`) so a freshly-bumped token is never re-matched.
3. ECharts base font sizes: theme `textStyle.fontSize 12→14`, axis `11→13`; new-figure
   axis/label sizes set from the same scale.

Risk: the dense mono header. Mitigation: screenshot the header at the larger scale and
confirm no wrap before finishing (the header already collapses meta spans behind
`sm/md/lg` breakpoints).

### 5.4 Analysis tab + five figures

New `src/ui/views/Analysis.tsx`, added to `App.tsx`'s `View` union and header nav
("Analysis"). Layout: a responsive gallery of five panels, each `.panel` with a
`FigureCaption`. Every figure: `animation:false`, `aria:{enabled:true}`, empty-state guard,
**N in caption**, `useFigureTheme`.

Data sourcing: figures requiring a candidate matrix use the **live candidate pool** when it
has ≥ `MIN_COHORT` (=8) scored candidates, otherwise a **deterministic demo cohort**
(§5.6), captioned explicitly as demo data.

1. **Parallel coordinates** — one polyline per candidate across all `PLACEHOLDER_CRITERIA`
   axes (axis = criterion, scaled to its `scale.min/max`, oriented by `higherIsBetter`).
   Line color encodes total MCDA score (Wong sequential). ECharts `ParallelChart` +
   `ParallelComponent`.
2. **Multi-dimensional risk bubble scatter** — one bubble per IMM condition:
   - x = incidence λ in events/1000-PY (log axis), from `conditionRate(prior)` (§5.5).
   - y = worst-case severity probability = `α/(α+β)` from `severity`.
   - color = body-**system group** (19 `IMMConditionFamily` → ~7 colorblind-safe groups).
   - size = expected mission contribution `expectedContribution(prior, missionDays)` (§5.5).
   `ScatterChart` (registered) + `VisualMapComponent` (size + categorical color).
3. **SPLOM** — pairwise scatter grid across the cohort. `PLACEHOLDER_CRITERIA` has **12**
   criteria; a 12×12 grid (144 cells) is illegible, so the SPLOM is **capped to a documented
   subset** (default ~5, one per family — e.g. conscientiousness, VO₂max, NASA cognition,
   teamwork, resilience), with the shown set labeled in the caption and easily reconfigured.
   Diagonal cell = variable name. `ScatterChart` + multiple `GridComponent` cells. (The full
   12×12 relationships are available losslessly in the correlation heatmap below.)
4. **Criterion-correlation heatmap** — criterion×criterion matrix; cell = Pearson r (toggle
   to Spearman) across the cohort. Diverging colorblind-safe colormap on [−1, 1].
   `HeatmapChart` + `VisualMapComponent`.
5. **Vulnerability-coupling heatmap** — rows = criteria, columns = IMM condition families;
   cell = coupling weight `|FAMILY_BETA[family]| × (#conditions in family whose
   vulnerabilityCriteria include the criterion)`, from `src/imm/simulate.ts` `FAMILY_BETA`
   (default −0.2) and `IMM_CONDITIONS`' `vulnerabilityCriteria`. Sequential colormap;
   visualizes the 58/100-condition β-modulation architecture no other figure shows.

New ECharts registrations in `echarts-base.ts`: `ParallelChart`, `ParallelComponent`,
`HeatmapChart`, `VisualMapComponent`. (`ScatterChart`, `GridComponent`, `Tooltip`, `Legend`
already registered.)

### 5.5 Data-prep modules (math-before-UI, TDD)

`src/analysis/correlation.ts`:
- `pearson(x:number[], y:number[]): number` — NaN-safe; constant column → 0.
- `rank(x:number[]): number[]` (average ranks for ties) → `spearman = pearson(rank(x),rank(y))`.
- `correlationMatrix(columns:number[][], method:"pearson"|"spearman"): number[][]` —
  symmetric, unit diagonal.

`src/analysis/imm-bubbles.ts`:
- `conditionRate(prior): number | null` — events/1000-PY: Gamma-Poisson `λ=α/β`; Lognormal
  `λ=exp(mu+σ²/2)`; Fixed `λ_fixed`. Beta-Bernoulli conditions are per-event probabilities
  (per-EVA / per-SPE), not per-person-time rates, so `conditionRate` returns `null` for them;
  the bubble figure excludes them from the λ axis and lists them separately (count noted in
  the caption, details in tooltip). Unit conversion per-person-day → per-1000-PY (`×365×1000`).
- `worstCaseSeverity(prior): number` = `α/(α+β)`.
- `expectedContribution(prior, missionDays): number` — λ over the mission × an impairment
  proxy from treated `fi_cp1..3`/`dt_cp*`; bubble-size scaled by sqrt for area-true encoding.
- `familyToSystemGroup(family): SystemGroup` — 19→~7 mapping + a fixed group→color map.

`src/analysis/coupling.ts`:
- `couplingMatrix(criteria, conditions, familyBeta, defaultBeta): number[][]` per §5.4 cell.

`src/analysis/demo-cohort.ts` — §5.6.

### 5.6 Demo cohort

`makeDemoCohort(n=40, seed=0xc0ffee)` — seeded PRNG (same LCG as `TestFigureHost`) produces
`n` candidates with per-criterion scores drawn from a **known latent factor structure** so
the correlation heatmap and SPLOM show real, non-trivial correlations (e.g.,
conscientiousness ↔ emotional-stability positive; a fitness factor driving VO₂max). The
injected covariance is documented in-module and asserted recoverable by the test
(`correlationMatrix(cohort) ≈ injected ± tol`). Scores clamp to each criterion's
`scale.min/max`. Captioned "synthetic demonstration cohort (N=40, seed 0xc0ffee)".

---

## 6. File-by-file change list

**New**
- `src/ui/theme/useTheme.ts`, `src/ui/theme/ThemeToggle.tsx`
- `src/ui/figures/useFigureTheme.ts`
- `src/ui/figures/theme-dark.ts` (registers `selectron-dark`)
- `src/ui/views/Analysis.tsx`
- `src/ui/figures/ParallelCriteria.tsx`, `RiskBubbleScatter.tsx`, `CriteriaSplom.tsx`,
  `CriterionCorrelationHeatmap.tsx`, `VulnerabilityCouplingHeatmap.tsx`
- `src/ui/figures/captions/analysis.captions.ts`
- `src/analysis/correlation.ts`, `imm-bubbles.ts`, `coupling.ts`, `demo-cohort.ts`
- Tests in §7.

**Modified**
- `index.html` — no-FOUC inline script; drop hard-coded `color-scheme` meta.
- `src/index.css` — channel vars; `:root[data-theme="light"]`; `rgb(var(--x))` rewrite;
  `--signal-dim`/`--grid-dot` derivations.
- `tailwind.config.js` — colors → `rgb(var(--x) / <alpha-value>)`; `fontSize` +2px.
- `src/ui/App.tsx` — `View` union + nav += "analysis"; mount `<ThemeToggle/>`; render
  `<Analysis/>`.
- `src/ui/figures/echarts-base.ts` — register Parallel/Heatmap/VisualMap.
- `*.tsx` — ordered `text-[Npx]` +2px replacement (mechanical).

**Untouched (guarded):** all existing figure components, `TestFigureHost`, paper figures,
`tests/e2e/paper-figures.spec.ts` + `__snapshots__`.

---

## 7. Testing

- `tests/analysis/correlation.test.ts` — pearson/spearman vs known values; ties; constant
  column → 0; n<2 guard; matrix symmetry + unit diagonal. **Written first.**
- `tests/analysis/imm-bubbles.test.ts` — `conditionRate` per distribution; severity;
  contribution monotonicity; family→group totality (every family maps).
- `tests/analysis/coupling.test.ts` — cell formula on a hand-built fixture; zero for
  uncoupled criteria.
- `tests/analysis/demo-cohort.test.ts` — determinism (same seed → same matrix); recovered
  correlation ≈ injected; clamping to scale.
- `tests/ui/analysis_figures.test.tsx` — render-smoke for all five, mirroring
  `tests/ui/imm_posterior_hist.test.tsx` (mock `echarts-for-react/lib/core`; assert
  caption/DOM text + no-throw on empty/degenerate inputs).
- `tests/ui/theme_toggle.test.tsx` — default dark; toggle sets `data-theme="light"`;
  persists to localStorage; re-mount reads it.
- **Regression:** run `tests/e2e/paper-figures.spec.ts` after the chrome rewire; with
  `:root` defaults byte-identical to today it must pass unchanged.
- Full `npm test` + `npm run typecheck` green.

## 8. Risks & mitigations

- R1 — `index.css` `var(--x)`→`rgb(var(--x))` rewrite misses a site → broken color.
  *Mitigation:* enumerate all 22; visual check both themes.
- R2 — `text-[Npx]` double-bump. *Mitigation:* strictly descending order; diff review.
- R3 — Header wrap at +2pt. *Mitigation:* screenshot both widths; rely on existing
  responsive `hidden sm/md/lg`.
- R4 — Manuscript snapshot drift. *Mitigation:* Approach A touches no shared figure;
  run paper-figures e2e as a gate.
- R5 — Beta-Bernoulli conditions have no per-PY rate. *Mitigation:* explicit handling in
  `conditionRate` (excluded from the λ axis with a documented sentinel; shown via tooltip).

## 9. Acceptance criteria

- AC1 — Toggle flips light/dark across all chrome + the 5 Analysis figures; persists; no
  flash on reload.
- AC2 — Light palette text meets ≥4.5:1 on `bg-1` (spot-checked ink-0/2/3, signal, go, warn).
- AC3 — Type visibly ~2px larger everywhere; header does not wrap/overflow at default width.
- AC4 — Analysis tab renders all 5 figures with the demo cohort (and with a live ≥8 pool);
  every caption shows N; empty states are graceful.
- AC5 — All new vitest suites pass; `npm test`, `typecheck`, and `paper-figures.spec.ts`
  all green; zero changes to manuscript snapshots.

## 10. Out-of-scope follow-ups

- F-N1 — Retrofit existing working-view charts to be theme-aware in dark mode (Approach B).
- F-N2 — OS-preference (`prefers-color-scheme`) as the first-load default.
- F-N3 — Optionally promote one Analysis figure into the manuscript supplementary set
  (separate review; would re-baseline snapshots intentionally).
