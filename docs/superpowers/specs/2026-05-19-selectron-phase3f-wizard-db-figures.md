# Phase 3F — Wizard + persistent DB + Q1-grade figures + dashboard chrome

**Date:** 2026-05-19
**Author:** Diego (controller-brainstormed; ratified section-by-section 2026-05-19 ~06:50 UTC)
**Status:** APPROVED — ready for writing-plans
**Related:** [Iter 1 design](2026-05-18-selectron-design.md), [Iter 3 risk design](2026-05-18-selectron-iter3-risk.md)
**Branch:** `iter1-phase0`

---

## 1. Motivation

After Phase 3D landed the wired Mission-risk tab (Tasks 54–57, commit `cea82ab`), the Iter-3 engine math is feature-complete but the UI still treats data as ephemeral — a single sliders-and-dropdown screen with no persistence, no audit trail, and no way to compare candidates over time. Diego asked (2026-05-19 06:35 UTC) for four end-of-iteration additions that turn Selectron from a research prototype into a research-record tool:

1. A **step-by-step wizard** for entering "the required data for the app to work reliably."
2. A **reliable client-side database** to persist and retrieve that data.
3. **Q1-journal-grade figures** built via the `/echarts` skill, "explained like this was prepared for a Q1 scientific journal," displayed in-line.
4. New chrome built via the `/frontend-design` skill.

Phase 3F bundles those four asks into one cohesive phase. It does not block any existing thread — Task 58 sign-off, Iter-1 release, Iter-2 criteria ratification, and Phase 3A/3B real-priors work continue in parallel.

## 2. Scope

### In scope

- Persistent client-side DB (Dexie / IndexedDB) for candidates, criterion entries with evidence, attachments (PDF/PNG/JPG ≤5 MB each), and simulation sessions.
- A 4-step wizard: **Identity → Criteria → Review → Mission & sim**.
- A Dashboard view that lists saved candidates with summary stats + a top-of-page CHI plot.
- Replacement of the existing top-level tab strip (`Selection` / `Mission risk`) with a `Dashboard` / `Wizard` / `Sim` view-switcher.
- Seven figures, all rendered via the `/echarts` skill: three upgrades (`PosteriorPlot`, `RiskHistogram`, `ConditionContribution`) and four new (Dashboard summary, per-criterion evidence reference, score breakdown radar, mission-comparison small multiples).
- Q1-journal-style figure captions rendered inline beneath every figure, with a methodology-paragraph reveal pattern.
- New chrome for **Dashboard + Wizard only**, produced via the `/frontend-design` skill. Existing chrome (header, footer, Sim view) stays.
- JSON export/import of the entire DB (no backend).

### Out of scope

- Multi-user support, cloud sync, or any server-side component. Selectron remains pure-TS, single-repo, no backend.
- Multi-candidate ranking UI (deferred to Iter-2).
- Mobile / responsive design below 1024 px (matches current Iter-1 breakpoint).
- Replacement of `SYNTHETIC_PRIORS` with a real `priors.json` — that is Phase 3A/3B, runs in parallel.
- V&V dossier (Task 60) — that is Phase 3E.

## 3. Tooling decisions (locked)

| Layer | Choice | Rationale |
|---|---|---|
| IndexedDB wrapper | **Dexie 4.x** | TypeScript-native, BLOB support, schema versioning, queryable indexes. ~30 KB gzipped. |
| State management | **useState** in `App.tsx` for `view`; **React Context** for wizard draft + DB handle | Matches existing codebase pattern. No new global-store dep. |
| Routing | **None (useState view switcher)** | Pure-TS, no router dep; loses shareable URLs (acceptable for single-user local tool). |
| Figures | **`/echarts` skill (Apache ECharts 6.x)** with Nature theme default | Skill bundles 297 examples + 21 themes + preflight checker; theme is Q1-publication-grade. |
| Caption rendering | Per-figure `*.captions.ts` modules + shared `<FigureCaption />` component | Separates copy from chart code so methodology text edits don't touch ECharts options. |
| Chrome | **`/frontend-design`** for Dashboard + Wizard only | Existing Iter-1 chrome (Task 16) stays — accepted, no need to re-skin. |

## 4. Data model — Dexie v1

Single DB named `selectron`. Schema lives in `src/db/schema.ts`. Repository wrappers in `src/db/repository.ts`.

```ts
candidates {
  id            string          // uuid v4   [primary]
  alias         string          //           [indexed]
  fullName      string?
  createdAt     string          // ISO        [indexed]
  updatedAt     string          // ISO        [indexed]
  status        "draft" | "ready"            [indexed]
  notes         string?
  photoBlobKey  string?         // → attachments.id
}

criterionEntries {
  id              string                       [primary]
  candidateId     string                       [indexed, fk]
  criterionId     string                       [indexed]   // e.g. "psych.conscientiousness"
  rawValue        number
  unit            string?
  instrument      string?
  measurementDate string?       // ISO date
  citationDoi     string?
  citationUrl     string?
  citationFree    string?       // freeform when no DOI / URL
  notes           string?
  attachmentKeys  string[]      // → attachments.id[]
  updatedAt       string        // ISO
}

attachments {
  id          string                           [primary]
  filename    string
  mimeType    string
  sizeBytes   number
  blob        Blob               // actual file BLOB
  sha256      string                           [indexed]   // dedup
  uploadedAt  string             // ISO
}

simSessions {
  id              string                       [primary]
  candidateId     string                       [indexed]
  missionId       string                       [indexed]
  runAt           string         // ISO         [indexed]
  trials          number
  chiStar         number
  seed            number
  priorsVersion   string         // matches PriorsJson.model_version
  posterior       RiskPosterior  // mean / CI90 / CI95 / perConditionQTL — always
  chiSamples      number[]       // trials × Float64; needed for F2 re-renders from cache
  qtlSamples      number[]       // trials × Float64; needed for future F2-style QTL figure
  notes           string?
}

priorsCache {
  id            "active"                       [primary]
  priorsVersion string
  loadedAt      string           // ISO
}

_meta {
  id        "version"                          [primary]
  schemaVersion number
}
```

**Data-integrity rules:**

- Deleting a candidate cascades to its `criterionEntries` and `simSessions` (Dexie hook).
- Attachments are reference-counted; freed when the last referrer drops them.
- Schema version stored in `_meta`; mismatch on app boot triggers Dexie's `db.version(n).upgrade(...)` chain.

**Repository layer** (`src/db/repository.ts`) — async wrappers, no business logic:

```
createCandidate(input)            → Candidate
updateCandidate(id, patch)        → Candidate
listCandidates(filter?, sort?)    → Candidate[]
getCandidateWithEvidence(id)      → CandidateBundle
deleteCandidate(id)               → void   (cascades)
upsertCriterionEntry(entry)       → CriterionEntry
attachFile(file, candidateId)     → Attachment   (dedups by sha256)
detachFile(attachmentId, ownerId) → void
saveSimSession(session)           → SimSession
recentSimsFor(candidateId, n=10)  → SimSession[]
exportDb()                        → Blob   (JSON + base64 BLOBs)
importDb(blob)                    → void   (clears + restores)
```

**Persistence-as-you-type:** wizard auto-saves the in-progress candidate on debounced (300 ms) form changes; status stays `draft` until "Mark ready" or a successful sim.

**Dev fixtures:** `src/db/seedDev.ts` (gated by `import.meta.env.DEV`) loads 3 example candidates on first launch when the DB is empty. Production skips the seed.

## 5. UI structure

### Top-level state in `App.tsx`

```ts
type View =
  | { kind: "dashboard" }
  | { kind: "wizard"; candidateId: string; step: 0 | 1 | 2 | 3 }
  | { kind: "sim"; candidateId: string };

const [view, setView] = useState<View>({ kind: "dashboard" });
```

The current `tab: "Selection" | "Mission risk"` state is **removed**. The Selection tab's slider UI is preserved inside wizard step 3 (Review) for live posterior tweaking; the Mission risk tab moves to the Sim view.

### Header

Right-side `utc / build / seed` block stays. The left-side `iter 01 …` chip becomes a clickable breadcrumb: `dashboard › <alias> › step <N> of 4` or `dashboard › <alias> › sim`.

### Dashboard view (`src/ui/views/Dashboard.tsx`)

```
+----------------------------------------------------------------+
| Header                                                         |
+----------------------------------------------------------------+
| Toolbar: [+ New candidate] [Generate synthetic] [import] [export]
|          filter: status   sort: updatedAt desc                 |
+----------------------------------------------------------------+
| F4 — Dashboard summary (CHI per candidate, sorted desc)        |
+----------------------------------------------------------------+
| Candidate cards (grid, 3 per row)                              |
|   alias · status chip · last CHI · updated · [edit] [sim] [⋯]  |
|   click anywhere on card → wizard step 3 (Review)              |
+----------------------------------------------------------------+
```

Empty state: friendly CTA + (dev only) seed candidates pop in automatically.

### Wizard view (`src/ui/views/Wizard.tsx`)

```
+----------------------------------------------------------------+
| Header with breadcrumb                                         |
+----------------------------------------------------------------+
| Step strip: [1 Identity] — [2 Criteria] — [3 Review] — [4 Sim] |
|              done             current         locked    locked |
+----------------------------------------------------------------+
| Step content panel (see Section 6)                             |
+----------------------------------------------------------------+
| Footer: [← back]                       [save draft] [next →]   |
+----------------------------------------------------------------+
```

- Completed steps are clickable (free-back-nav); forward jumps require current-step validation.
- "save draft" persists explicitly; auto-save runs continuously.
- "next →" on step 4 triggers `simulateMission` and transitions to the Sim view.

### Sim view (`src/ui/views/Sim.tsx`)

```
+----------------------------------------------------------------+
| Header with breadcrumb                                         |
+----------------------------------------------------------------+
| Mission picker + sim config strip                              |
+----------------------------------------------------------------+
| F2 CHI histogram  |  RiskCard summary                          |
+-------------------+--------------------------------------------+
| F3 Condition contribution stacked bar                          |
+----------------------------------------------------------------+
| F7 Mission-comparison small multiples  [Run comparison] button |
+----------------------------------------------------------------+
| Sim history (this candidate)                                   |
+----------------------------------------------------------------+
| [← Back to Review]                                             |
+----------------------------------------------------------------+
```

### Loading / error UX

Each view has its own `useEffect` + loading state. Errors surface as a non-modal `<Toast />` component (new, ~30 lines).

## 6. Wizard step contents

### Step 1 — Identity

Inputs:
- `alias` (required, ≤40 chars, unique-ish — soft warning on dup, not blocking)
- `fullName` (optional)
- `photo` (optional, ≤5 MB, image/* only)
- `notes` (optional, multi-line)

**Next-button:** enabled when `alias.length >= 2`.

Footer hint: "Identity fields are stored client-side only. No data leaves your machine."

### Step 2 — Criteria (heavy step)

Collapsible `<table>`-style list, one row per `PLACEHOLDER_CRITERIA` entry (5 today; expands to 20 once `docs/criteria.md` is ratified).

**Collapsed row:** `[▸] 01 · Conscientiousness (Big Five)    60.1 / 100    ● evidence ok`

**Expanded row** carries:
- Raw value (slider over `criterion.scale`, ±0.1 step), unit (read-only from criterion), instrument (text), measurement date (date picker), citation (radio: DOI / URL / freeform + input), notes (textarea), attachments (multi-file upload, ≤5 MB each, PDF/PNG/JPG only).
- An embedded **F5 mini-figure** showing the entered value against a reference distribution.

**Status dot rules:**
- `●` evidence ok — rawValue + ≥1 citation field present.
- `◐` partial — rawValue present, no citation.
- `○` no value — rawValue missing.

**Validation:** rawValue ∈ `[scale.min, scale.max]`. Attachments validated (size, mime) client-side.

**Next-button:** enabled when **all** criteria show `●` or `◐`. Soft warning if any `◐`.

### Step 3 — Review

Two-pane:

- **Left (60 %):** read-only summary table — alias / rawValue / normalized z / status dot / citation snippet. Inline `[edit]` jumps back to step 2 with that row expanded.
- **Right (40 %):** live **F1 PosteriorPlot** + existing `ScoreCard`, refreshed on debounced edits (300 ms; same debounce used by the IDB auto-save) + new **F6 score breakdown radar**.

**Next-button:** always enabled. "Mark ready" flips status `draft` → `ready` and advances to step 4.

### Step 4 — Mission & sim

```
┌─ Mission ────────────────────────────────────────────────────┐
│ MissionPicker (unchanged from Task 54)                       │
│ mission metadata strip (duration · crew · EVAs · comms)      │
└──────────────────────────────────────────────────────────────┘

┌─ Sim config ─────────────────────────────────────────────────┐
│ Trials    [▿ 25,000]   (5k / 10k / 25k / 50k / 100k)         │
│ χ* threshold [——●——————] 0.7  (slider 0.5–0.9)               │
│ Seed      [_0xc0ffee_]                                       │
│ Priors    active: synthetic-iter3-ui-scaffold [info]         │
└──────────────────────────────────────────────────────────────┘

                  [▶ Run simulation]
```

**On click "Run":** `requestAnimationFrame` → `simulateMission(...)` → `saveSimSession(...)` → transition to Sim view.

## 7. Figures + `/echarts` integration

### File layout

All figures move under `src/ui/figures/`. One file per figure id. Shared `src/ui/figures/theme.ts` exports the Nature theme + colorblind palettes (Okabe-Ito sequential, Wong categorical). ECharts core registration centralized in `src/ui/figures/echarts-base.ts` — eliminates the per-file `echarts.use([...])` boilerplate duplicated across Task 14 / Task 56.

### The 7 figures

| ID | Name | Series | Reads | Placement | Notes |
|----|------|--------|-------|-----------|-------|
| F1 | Posterior over MCDA score | histogram + CI90 markArea + mean markLine | `Posterior.samples` | Wizard step 3 (right pane) | **Upgrade** of existing `PosteriorPlot.tsx`. |
| F2 | CHI posterior histogram | histogram + CI90 markArea + mean markLine | `simSession.chiSamples` (fresh run or DB-cached) | Sim view | **Upgrade** of `RiskHistogram.tsx`. |
| F3 | Per-condition QTL contribution | stacked horizontal bar + family legend | `RiskPosterior.perConditionQTL` | Sim view | **Upgrade** of `ConditionContribution.tsx`; add 90 % CI whiskers per segment. |
| F4 | Dashboard CHI per candidate | dot plot / lollipop + CI90 whiskers, sorted desc | latest `simSessions.posterior.chi` per candidate | Dashboard, top | **New.** Empty when no sims exist. |
| F5 | Per-criterion evidence reference | mini histogram + entered-value vertical marker | criterion reference distribution (placeholder normal; empirical once N ≥ 10) | Wizard step 2, inside expanded row | **New.** 180 × 60 px. Rendered only for the currently expanded row. |
| F6 | Score breakdown radar | radar (polar) | weighted contribution per criterion = `w̄_k · z(x_k)` | Wizard step 3 (right pane) | **New.** |
| F7 | Mission-comparison small multiples | grid of 5 small CHI histograms | `simulateMission` on candidate × all 5 missions, cached | Sim view, below F2 | **New.** On-demand button — heavy (5 × 25k trials ≈ 125k); cached in `simSessions`. |

### `/echarts` integration pattern

For each figure (existing or new):

1. **Pattern lookup** in `/echarts`'s 297-example SQLite before authoring; pick the closest match.
2. **Theme:** import `natureTheme` from `theme.ts`. Per-figure override allowed for genuine cause.
3. **Preflight gate** on every figure file (vite plugin or pre-commit hook): deterministic export, no animation in static figures, contrast ≥ 4.5 :1, axis labels present, units in axis title.
4. **Export:** every figure gets a `<Figure id onExport>` wrapper that exports SVG on click. PNG deferred.

### Q1 caption pattern

Each figure renders a `<FigureCaption />` below it. Caption block:

```
Figure <id> | <one-line description>
─────────────────────────────────────
Methods.    <2–3 sentences>. <statistical estimator>, sample size
            <n>, software ECharts <ver> via Selectron <commit>.
Source.     <data origin: synthetic-iter3-ui-scaffold | real priors.json | simSession <id> at <ISO>>.
Repro.      seed=<n>, trials=<m>, model_version=<v>.
```

Captions render collapsed by default (one-line summary + `[expand methodology ▾]`). Expanded shows full block. Copy lives in `src/ui/figures/<figure-id>.captions.ts`.

## 8. Migration path

The Iter-1 `App.tsx` has zero persistence. First launch under Phase 3F: empty DB → Dashboard empty state → `+ New candidate` opens the wizard with criterion scores prefilled to each criterion's scale midpoint.

The existing `generateCandidate` synthetic-candidate code path is **kept** and exposed as a Dashboard button "Generate synthetic candidate" — useful for demos and to prefill the wizard during testing. Seeded, reproducible.

Dev mode auto-seeds 3 example candidates (`src/db/seedDev.ts`) on a fresh DB.

## 9. Testing strategy

**Unit (vitest, `fake-indexeddb`):**
- `src/db/repository.test.ts` — every CRUD function, attachment dedup-by-sha256, cascade delete.
- `src/ui/figures/<id>.captions.test.ts` — caption text templating (string assembly only).
- `src/db/schema-migrations.test.ts` — open v1 DB, migrate to v2 (currently a no-op stub), verify data preserved.

**Component / integration:**
- React Testing Library renders per wizard step in isolation; assert validation gating.
- One end-to-end wizard test that walks Identity → Criteria → Review → Sim with synthetic input and asserts the resulting `simSessions` row.

**E2E (Playwright):**
- Smoke per view: Dashboard renders, Wizard step strip navigates, Sim view shows all 4 result figures.
- Visual snapshot diff on each of the 7 figures under deterministic seeds. Snapshots committed to `tests/e2e/__snapshots__/`.

**No coverage gate** — project doesn't run coverage (Task 16 dropped the stub). Phase 3F doesn't add one.

## 10. Acceptance criteria

**Functional gates (all must pass):**

1. Open the app in a clean profile → Dashboard renders empty state.
2. Click `+ New candidate` → wizard step 1.
3. Enter alias `test-1` + advance through all 4 steps with valid evidence (≥1 citation per criterion).
4. Click `▶ Run simulation` on step 4 → Sim view renders with all 4 result figures populated.
5. Refresh the browser → Dashboard shows `test-1` with last-CHI summary.
6. Click the card → Sim view restores from `simSessions`.
7. Click `[edit]` on the card → wizard step 3 (Review) reopens with all data restored.
8. Export the DB to JSON → open in a fresh profile → import → identical Dashboard state, byte-identical sim posterior on re-run.

**Quality gates:**

- `npm test` — current 106 tests + estimated +35 new tests, all pass.
- `npm run typecheck` — exit 0.
- `npm run build` — green; bundle gzipped ≤ 1.5 MB.
- `npm run e2e` — Playwright smoke + 7 figure snapshot diffs green.
- Diego visual sign-off on ≥ 3 of the 7 figures (sample, not exhaustive).

## 11. Risks and follow-ups

| Risk | Likelihood | Mitigation |
|---|---|---|
| Dexie v1 schema wrong; lossy v2 migration needed | Medium | Flat denormalized schema is easy to migrate; migration test scaffold in 3F.1. |
| `/echarts` refactor of existing figures regresses look-and-feel | Medium-low | First upgrade is **F2 only**; land + Diego sign-off; *then* F1 and F3. |
| F7 mission-comparison click-to-result time ~7 s (5 × 25k trials) | High | Explicit "Computing 5 missions…" banner; checkbox to drop to 5 k trials/mission. |
| BLOB attachments exceed browser quota (~50 MB) | Low | Dashboard quota gauge; soft-cap warning at 80 %, hard-block at 95 %. |
| Phase 3F (27 tasks) collides with Phase 3A/3B priors curation | Medium | They don't share files. Phase 3A/3B swaps `SYNTHETIC_PRIORS` → real `priors.json`; Phase 3F doesn't read priors directly. Parallel or serial per Diego's preference. |
| Iter-1 Task 17 sign-off and Iter-2 criteria ratification still open | Medium | Phase 3F does not block either. Both are tracked in STATUS.md. |

## 12. Locked judgment calls (override by pushing back during plan-writing)

1. F5 per-criterion mini-figure rendered only for the **currently expanded row**.
2. Captions collapsed-by-default; one-line summary + `[expand methodology]`.
3. F7 mission-comparison is **on-demand**, not auto-run.
4. Dashboard cards click → wizard step 3 (Review), **not** step 1.
5. Selection + Mission risk tabs removed; replaced by wizard step 3 + Sim view.
6. `generateCandidate` kept as a Dashboard "Generate synthetic candidate" button.
7. Nature theme is the default; per-figure override allowed.

## 13. Sub-task decomposition

| Group | Description | Est. tasks |
|---|---|---|
| 3F.1 | Data layer — Dexie schema, repository, fixture loader, migration scaffold | 5 |
| 3F.2 | Dashboard view — list + new-candidate + 1 summary figure (F4) | 3 |
| 3F.3 | Wizard shell — step strip, navigation, context, persistence-as-you-type | 3 |
| 3F.4 | Wizard steps — Identity, Criteria-with-evidence, Review, Mission & sim | 5 |
| 3F.5 | Figure upgrades — refactor existing 3 + add 4 new under `src/ui/figures/` with shared theme | 7 |
| 3F.6 | Q1 captions — caption rendering pattern + per-figure copy | 2 |
| 3F.7 | Acceptance — full-suite + Playwright smoke + Diego visual sanity | 2 |
| **Total** | | **27** |

Implementable in 2–3 working sessions. No Phase 3A/3B priors dependency.

---

**End of spec.** Next: `writing-plans` skill produces `docs/superpowers/plans/2026-05-19-selectron-phase3f.md` decomposing the 27 sub-tasks into per-task contracts with file lists and acceptance criteria.
