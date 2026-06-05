# Health-Support Categories & Tiers — Design Spec

**Date:** 2026-05-28
**Status:** Approved (brainstorming) → ready for implementation plan
**Author:** Diego L. Malpica (with AI coding assistance)
**Repo:** Selectron · affects `src/imm/`, `src/data/`, `src/ui/`, `research/`

---

## 1. Motivation

Selectron's IMM Calculator already models a medical kit as a flat **resource vector**
(`IMMKitScenario.resources: Record<string, number>`) and drives treatment severity
through the **Resource Availability Factor** (`computeRAF` → `interpolateBetaPertByRAF`,
K15 §II.B.7 Fig 3). Today the user picks one of three kits (`none` / `issHMS` /
`unlimited`) via a bare three-button row in `CrewComposition.tsx`, and two real
dimensions of health support are **not modelled at all**:

1. **Telemedicine / ground support** — flight-surgeon Private Medical Conferences and
   real-time guidance, which degrade with comms delay.
2. **Onboard care provider** — none vs a trained Crew Medical Officer (non-physician)
   vs a physician — which gates whether stocked consumables can actually be *used*.

This feature makes the **categories of health support explicit, evidence-cited, and
visible on the frontend**, adds a literature-anchored **Medium** tier between `none`
and `issHMS`, and lets the **severity calculation respond** to telemedicine + provider
capability — all computed in-browser by the existing engine.

**Hard non-negotiable invariant:** the `issHMS` resource vector and its IMM outputs
must remain **byte-identical**, because they are the manuscript's K15 validation-gate
contract. The new model is *additive*: it is the identity transform for `issHMS` and
`unlimited`, and only changes behaviour for the new/empty tiers.

---

## 2. Goals / Non-goals

**Goals**
- Define 4 health-support **categories**, each populated with **real, cited** contents
  (no fabricated items): telemedicine, onboard provider, medication formulary,
  procedures & equipment.
- Define 4 **tiers** mapped to NASA's published five levels of care
  (NASA-STD-3001 Vol 1): None (LoC I), Medium (LoC II–III), ISS (LoC IV),
  Unlimited (LoC V).
- Make severity **differentiate** across tiers via a care-capability model
  (resource-class gating) that is the identity for ISS/Unlimited (K15-safe).
- A **cool, modern** frontend, consistent with the existing design tokens, that lets
  the user select a tier, inspect a cited category breakdown, and see a **live
  severity readout** (CHI / RAF / HSRB verdict vs the ISS baseline).
- Every kit item / tier capability carries a `source_ref` (mirroring the
  `imm-priors.json` three-tier provenance discipline).

**Non-goals (YAGNI — explicitly out of scope for v1)**
- A full **custom-kit editor** (toggling individual items). Deferred; presets only.
- **Per-condition** hand-authored care-requirement tags for all 100 conditions
  (delivery class is *derived from existing `required_resources`*, not re-tagged).
- Changing `issHMS` / `unlimited` contents or the K15 gate brackets.
- Empirically *calibrating* the Medium-tier deliverability weights (they are
  documented, tunable, levels-of-care-derived parameters — see §4.3, treated with
  the same honesty as `FAMILY_BETA`).

---

## 3. Domain model — categories × tiers

### 3.1 Four health-support categories (the differentiators)

| # | Category | Field in model | Cited basis |
|---|---|---|---|
| 1 | **Telemedicine / ground support** | `capabilities.telemedicine: "none" \| "audio" \| "video"` | NASA-STD-3001 LoC I (private audio) → LoC II (private video/telemedicine); Doarn 2016; CSA Medical Support; Lugg 1999 (Antarctic teleconsult) |
| 2 | **Onboard provider** | `capabilities.provider: "none" \| "cmo" \| "physician"` | Hailey 2011 (2 CMOs/crew, non-physician); PMC5765846 (CMO 40–70 h training); ConOps NTRS 20200001715 (physician astronaut = director of care) |
| 3 | **Medication formulary** | `categories.medications[]` (grouped by NASA pack class) | NASA "3.001 Medical Kit — Contents & Reference" (2015); OCHMO TB-006 (nine packs, ~190 meds); Diaz 2024 (2023 formulary, 106 meds); Wotring 2015 |
| 4 | **Procedures & equipment** | `categories.procedures[]` | HMS hardware report NTRS 20100042371 (ALSP/AMP/Physician Equipment Pack); Hamilton 2008 |

Each category entry is `{ id, label, deliveryClass, source_ref }` (+ `dose`/`qty`
where applicable). `source_ref` points to an entry in a new `research/` markdown.

### 3.2 Four tiers (NASA five-levels-of-care anchored)

NASA-STD-3001 Vol 1 defines five levels of care; verbatim per ConOps NTRS 20200001715:
LoC I = first aid + BLS + private *audio*; LoC II = + clinical diagnostics + ambulatory
care + private *video/telemedicine*; LoC III = + limited ALS + trauma + limited dental;
LoC IV = + sustainable ALS + limited surgery + dental + medical imaging; LoC V =
autonomous ALS/ambulatory/surgical. Mission mapping (Neis & Klaus 2014): **ISS = LoC IV**.

| Tier | Level of Care | telemedicine | provider | Maps to existing kit | Cited analog |
|---|---|---|---|---|---|
| **None** | I | `none` (audio only) | `none` | `IMM_KITS.none` (empty) | self/buddy first aid |
| **Medium** | II–III | `video` | `physician` (single, limited) | **NEW** (subset of issHMS) | Antarctic/Concordia station (Lugg 1999; CARMM; ESA Concordia; Pattarini 2016) |
| **ISS** | IV | `video` | `cmo` | `IMM_KITS.issHMS` **(FROZEN)** | ISS CHeCS/HMS |
| **Unlimited** | V | `video` | `physician` | `IMM_KITS.unlimited` | theoretical ceiling |

Note the **Medium** tier is the real **Antarctic-station / Concordia** model — a sole
physician + advanced telehealth + point-of-care diagnostics + limited ALS/surgery,
with evacuation often impossible — which is itself ESA/NASA's canonical long-duration
*analog*, making it the ideal "Medium" for an analog-astronaut selection tool.

---

## 4. Severity model — delivery-class gating

### 4.1 Delivery classes

Every resource key in `issHmsResources` is assigned a **delivery class** describing what
capability is needed to *use* it (derived from the NASA pack structure, not re-elicited):

| Class | Meaning | Examples | Gated by |
|---|---|---|---|
| `self` | Self-administered from a checklist | oral analgesics, oral antibiotics, antihistamine, antacid, oral-rehydration, topical-* | always deliverable |
| `guided` | Administrable by a trained layperson under remote guidance | injectables, IV fluids, diagnostics, eye-drops, suture-kit (minor), splint | telemedicine ≥ `video` |
| `provider` | Needs procedural skill / a provider present | defibrillator/AED, chest-tube, intubation/airway, surgical, cardiac-monitor, advanced ALS | provider ≥ `cmo`/`physician` |

The resource→class map lives in `health-support.ts` and is documented + cited (the
NASA "Physician Equipment Pack" and ALSP items → `provider`; "Convenience/Oral Med
Pack" → `self`).

### 4.2 Effective availability (the one integration point)

In `simulate.ts` where `availableResources` is built from `kit.resources`
(currently `const availableResources = { ...kit.resources }`), pre-gate each quantity by
a **per-tier × per-delivery-class deliverability weight** ∈ [0,1]:

```
effectiveAvailable[r] = kit.resources[r] × DELIVERABILITY[tierId][ classOf(r) ]
```

`computeRAF`, `interpolateBetaPertByRAF`, and the consumption-decrement logic are
**unchanged** — they simply operate on the gated vector. The weight is specified **per
tier** (a 4×3 table), *justified by* (not mechanically derived from) the level-of-care
capability enums, which avoids the paradox of ranking weights purely by provider
credential:

| Tier (LoC) | `self` | `guided` | `provider` | Rationale |
|---|---|---|---|---|
| None (I) | 1 | 0 | 0 | audio only, no provider → only self-care deliverable |
| Medium (II–III) | 1 | 1 | **0.6** | video telemedicine enables guided care; a single austere-setting physician gives *limited* sustained ALS/surgery (no resupply, evac often impossible) |
| ISS (IV) | 1 | 1 | 1 | identity — the K15 calibration baseline (mature, ground-backed LoC IV) |
| Unlimited (V) | 1 | 1 | 1 | identity — theoretical ceiling |

The `capabilities` enums (`telemedicine`, `provider`) remain as **cited descriptive
metadata** surfaced in the UI; the deliverability table is the single engine parameter.

### 4.3 The K15 invariant (provably safe)

For **ISS** and **Unlimited**, every class weight is `1`, so
`effectiveAvailable == kit.resources` exactly → `computeRAF` output is identical →
**issHMS / unlimited IMM outputs unchanged → K15 gate passes unchanged.** This is the
load-bearing safety property and is asserted by a dedicated test (§6). The ISS row being
all-`1` is doubly justified: it is the K15 calibration baseline *and* LoC IV is NASA's
mature, resupplied, ground-backed system.

The modifier therefore only bites for **Medium** (and trivially refines **None**, which
is already mostly empty). The Medium-tier `provider = 0.6` weight ("limited surgical/ALS"
per LoC III) is a **documented, tunable, levels-of-care-derived parameter**, *not*
empirically calibrated — disclosed exactly as `FAMILY_BETA` is in the manuscript
(§2.3/§4.4). It is the single judgement-call number in the model and is exposed for
override.

---

## 5. Data model & provenance

### 5.1 New file: `src/data/health-support.ts`
```ts
export type DeliveryClass = "self" | "guided" | "provider";
export type Telemedicine = "none" | "audio" | "video";
export type Provider = "none" | "cmo" | "physician";

export interface HealthSupportItem {
  id: string;            // resource key (matches issHmsResources / required_resources)
  label: string;         // human-readable (e.g., "Ondansetron (Zofran)")
  category: "medications" | "procedures";
  packClass?: string;    // NASA pack class for grouping (e.g., "Oral Med Pack")
  deliveryClass: DeliveryClass;
  source_ref: string;    // → research/ markdown anchor
}

export interface HealthSupportTier {
  tierId: "none" | "medium" | "issHMS" | "unlimited";
  label: string;
  levelOfCare: "I" | "II-III" | "IV" | "V";
  capabilities: { telemedicine: Telemedicine; provider: Provider };
  source_ref: string;
  // resources resolved from IMM_KITS (issHMS/unlimited/none untouched);
  // medium gets an explicit, cited subset resource vector.
}

export const RESOURCE_DELIVERY_CLASS: Record<string, DeliveryClass>;
export const HEALTH_SUPPORT_TIERS: Record<string, HealthSupportTier>;
export const DELIVERABILITY: Record<HealthSupportTier["tierId"], Record<DeliveryClass, number>>;
// gate a resource vector by a tier's per-class deliverability weights (§4.2 table)
export function gateAvailable(resources: Record<string, number>, tierId: HealthSupportTier["tierId"]): Record<string, number>;
```

- `IMMKitScenario` gains an optional `capabilities?: { telemedicine; provider }` field
  (`types.ts`). `none`/`issHMS`/`unlimited` get capabilities set to the identity-safe
  values in §4.3. **`kits.ts` `issHmsResources` is not edited.**
- New `IMM_KITS.medium` (or via `health-support.ts`) — a cited subset resource vector.
- **Provenance:** every `HealthSupportItem.source_ref` and tier `source_ref` resolves
  to `research/2026-05-28_health_support_sourcing.md`, which lists the verified
  citations (see §8). Mirrors the `imm-priors.json` provenance contract.

---

## 6. Verification & validation

- **K15 invariant test** (new): assert `gateAvailable(issHMS.resources, "issHMS")`
  deep-equals `issHMS.resources`, and same for `"unlimited"`. Plus re-run the existing K15
  reproduction gate (`npm run validate:imm`) — must stay green with no bracket changes.
- **Delivery-class unit tests:** the `DELIVERABILITY` table values (§4.2); a `provider`-class
  resource zeroes out under tier `none`; a `guided` resource zeroes under tier `none`;
  Medium scales `provider`-class quantities by 0.6.
- **Medium-tier smoke test:** Medium yields CHI strictly between `none` and `issHMS` on a
  representative mission/condition.
- **Frontend:** Playwright test that selecting each tier updates the live readout; vitest
  for the breakdown component.

---

## 7. Frontend design

**Mount point:** `src/ui/views/CrewComposition.tsx`, the "Mission and kit configuration"
region (currently the 3-button kit row at lines ~352–364). Replace that row with a new
`HealthSupportPanel`.

**Components (new, under `src/ui/components/` or `src/ui/health/`):**
1. `HealthSupportTierPicker` — a **card grid** mirroring `MissionPicker` (same tokens:
   `panel`, `signal`, `ink-0..3`, `mono`/`display`, glow-on-active
   `shadow-[0_0_24px_rgba(245,181,65,0.18)]`). Each card: Level-of-Care chip,
   telemedicine + provider capability icons, one-line summary, status dot.
2. `HealthSupportBreakdown` — 4 collapsible category sections (Telemedicine, Onboard
   Provider, Medications [grouped by NASA pack class], Procedures & Equipment). Each item
   row shows label + a small **citation chip** (`[src]`) linking to the source. Items the
   selected tier cannot *deliver* are shown dimmed with a "needs telemedicine/provider"
   tag — making the capability-gating visible.
3. `HealthSupportSeverityReadout` — runs the existing `imm-simulate.worker` for the
   selected tier (preview trial count, e.g. T=5,000, for responsiveness; "run full
   T=100k" affordance) and shows CHI / fraction-lost / HSRB verdict chip, with a delta
   vs the ISS baseline. This is the "differentiation + severity on the frontend."

**Behaviour / state:** selecting a tier sets `state.kit = HEALTH_SUPPORT_TIERS[tier]`'s
`IMMKitScenario` (incl. `capabilities`); existing sim re-run path is reused. The K15
reproduction badge (lines ~496–501, 610) keeps firing only for `none/issHMS/unlimited`
on `iss-6mo`; the Medium tier deliberately shows **no** K15 badge.

**Aesthetic:** dark theme, monospace data, signal-amber accents, generous spacing, subtle
glow on active — matching MissionPicker. Colorblind-safe verdict chips (reuse existing
`LxCMatrix` color tokens).

---

## 8. Sourcing plan (verified anchors; per-item refs finalized at implementation)

All anchors below were verified live (2026-05-28) and are real/retrievable:

- **Levels of care:** NASA-STD-3001 Vol 1 (Crew Health); ConOps for Mars Exploration
  NTRS 20200001715 (verbatim LoC I–V); Hamilton et al. 2008 *J Trauma* (NTRS 20070032039);
  Neis & Klaus 2014 (mission→level table); NASA-TM-20205010009 (LoC IV foundation);
  NPR 8900.1.
- **ISS kit contents:** NASA "3.001 Medical Kit — Contents & Reference" (SpX-6, 2015);
  OCHMO TB-006 "Pharmaceutical Care" (nine packs, ~190 meds); HMS hardware report
  NTRS 20100042371; Diaz et al. 2024 *npj Microgravity* (DOI; 2023 formulary, 106 meds);
  Blue et al. 2019 *npj Microgravity*; Wotring 2015 *FASEB J*; Hailey et al. 2011; Bacal
  et al. 2004 *Mil Med*.
- **Telemedicine + provider:** Doarn et al. 2016 (telemedicine as a resource category);
  Doarn et al. 2021 *AsMA*; CSA Medical Support (PMC + flight surgeon model); PMC5765846
  (CMO training).
- **Medium / Antarctic analog:** Lugg 1999 "Telemedical experiences at an Antarctic
  station" (PMID 10534856); CARMM / Australian Antarctic Division Polar Medicine Unit;
  ESA Concordia ("White Mars"); Pattarini et al. 2016 (already in `references.bib`).

Implementation step: each `HealthSupportItem` and tier gets a `source_ref` into
`research/2026-05-28_health_support_sourcing.md`, with DOI/PMID/NTRS-ID per source.
**No item ships without a real citation.**

---

## 9. Risks & open questions

- **R1 — K15 regression.** Mitigated by the §4.3 identity property + the §6 invariant
  test. Run `validate:imm` before/after.
- **R2 — Medium deliverability weights are judgement calls.** Disclosed as tunable
  levels-of-care-derived parameters (not calibrated), consistent with `FAMILY_BETA`.
- **R3 — `medium` is not a K15 scenario.** Ensure all K15-badge / validation paths
  continue to gate on `none/issHMS/unlimited` only (they already do).
- **OQ1 — exact resource→deliveryClass assignments** for the ~50 keys: drafted from the
  NASA pack structure during implementation, reviewed by Diego.
- **OQ2 — preview trial count** for the live readout (responsiveness vs accuracy):
  default T=5,000 with an on-demand T=100k; confirm in plan.

---

## 10. Build sequence (for writing-plans)

1. Data + engine: `RESOURCE_DELIVERY_CLASS`, `deliverability`, `gateAvailable`,
   `capabilities` on `IMMKitScenario`, wire into `simulate.ts` `availableResources`.
   Add `IMM_KITS.medium`. **Add the K15 invariant + delivery-class tests first (TDD).**
2. `health-support.ts` tier/category data + `research/` sourcing markdown (cited).
3. Frontend: `HealthSupportTierPicker` → `HealthSupportBreakdown` →
   `HealthSupportSeverityReadout`; mount in `CrewComposition.tsx`.
4. V&V: re-run `validate:imm` (K15 green), Playwright tier-switch test.
