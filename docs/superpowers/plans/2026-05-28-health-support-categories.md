# Health Support Categories & Tiers — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add evidence-cited health-support *categories* (telemedicine, onboard provider, medication formulary, procedures) and a literature-anchored **Medium** tier, with severity that responds to care capability — all rendered on the frontend, without disturbing the K15 validation gate.

**Architecture:** A new per-tier × per-delivery-class *deliverability* table gates each kit's resource vector (`gateAvailable`) before the existing `computeRAF`/`interpolateBetaPertByRAF` severity path in `simulate.ts`. ISS and Unlimited are identity transforms (all weights = 1), so `issHMS`/`unlimited` outputs are byte-identical and the K15 gate is unchanged. The frontend replaces the three-button kit row with a card-grid tier picker + cited category breakdown + live severity readout (via the existing `imm-simulate.worker`).

**Tech Stack:** TypeScript, React 18, Vite, Tailwind (custom tokens: `panel`/`signal`/`ink-0..3`/`line`/`mono`/`display`), ECharts, Vitest, Playwright. Spec: `docs/superpowers/specs/2026-05-28-health-support-categories-design.md`.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/imm/types.ts` | Add `capabilities` + `"medium"` to `IMMKitScenario` | Modify |
| `src/imm/health-support.ts` | Delivery classes, `RESOURCE_DELIVERY_CLASS`, `DELIVERABILITY`, `gateAvailable`, tier + category data | Create |
| `src/imm/kits.ts` | Add `IMM_KITS.medium`; add identity-safe `capabilities` to existing kits | Modify |
| `src/imm/simulate.ts` | Gate `availableResources` via `gateAvailable` (line ~249) | Modify |
| `tests/imm/health-support.test.ts` | Delivery-class + K15-invariant unit tests | Create |
| `research/2026-05-28_health_support_sourcing.md` | Cited sources for every kit item/tier | Create |
| `src/ui/health/HealthSupportTierPicker.tsx` | Tier card-grid selector | Create |
| `src/ui/health/HealthSupportBreakdown.tsx` | 4-category cited breakdown | Create |
| `src/ui/health/HealthSupportSeverityReadout.tsx` | Live CHI/verdict readout vs ISS baseline | Create |
| `src/ui/views/CrewComposition.tsx` | Mount the panel; `kit: IMMKitScenario` | Modify |
| `tests/ui/health-support.test.tsx` | Component render tests | Create |
| `tests/e2e/health-support.spec.ts` | Tier-switch e2e | Create |

**Conventions to follow:** run a single test with `npx vitest run <path> -t "<name>"`; full suite `npm test`; typecheck `npm run typecheck`; K15 gate `npm run validate:imm`; e2e `npm run e2e`. Commit messages: `feat:`/`test:`/`docs:` prefix, **no AI co-author line** (Diego is sole author). Work on branch `iter1-phase0`.

---

## Task 1: Extend `IMMKitScenario` with capabilities + `medium` tier id

**Files:**
- Modify: `src/imm/types.ts:105-109`

- [ ] **Step 1: Edit the `IMMKitScenario` type**

Replace lines 105–109 of `src/imm/types.ts`:

```ts
export type Telemedicine = "none" | "audio" | "video";
export type CareProvider = "none" | "cmo" | "physician";

export type IMMKitScenario = {
  scenarioId: "none" | "medium" | "issHMS" | "unlimited" | "custom";
  label: string;
  resources: Record<string, number>;
  /**
   * Health-support care capabilities (Health-Support feature, 2026-05-28).
   * Optional for backward-compat; absent → treated as full capability (identity).
   * Drives delivery-class gating in src/imm/health-support.ts::gateAvailable.
   */
  capabilities?: { telemedicine: Telemedicine; provider: CareProvider };
};
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS (no usages broken — field is additive/optional, `"medium"` is a new union member not yet referenced).

- [ ] **Step 3: Commit**

```bash
git add src/imm/types.ts
git commit -m "feat(imm): add capabilities + medium tier id to IMMKitScenario"
```

---

## Task 2: Create `health-support.ts` — delivery classes, deliverability, `gateAvailable`

**Files:**
- Create: `src/imm/health-support.ts`
- Test: `tests/imm/health-support.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/imm/health-support.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { IMM_KITS } from "../../src/imm/kits";
import {
  gateAvailable, DELIVERABILITY, RESOURCE_DELIVERY_CLASS,
} from "../../src/imm/health-support";

describe("health-support delivery-class gating", () => {
  it("is the identity transform for issHMS (K15 invariant)", () => {
    const gated = gateAvailable(IMM_KITS.issHMS.resources, "issHMS");
    expect(gated).toEqual(IMM_KITS.issHMS.resources);
  });

  it("is the identity transform for unlimited (K15 invariant)", () => {
    const gated = gateAvailable(IMM_KITS.unlimited.resources, "unlimited");
    expect(gated).toEqual(IMM_KITS.unlimited.resources);
  });

  it("zeroes guided + provider classes for the none tier", () => {
    const probe = { "iv-fluid": 6, "defibrillator": 1, "analgesic-mild": 60 };
    const gated = gateAvailable(probe, "none");
    // iv-fluid is guided, defibrillator is provider → 0 under none; analgesic-mild is self → kept
    expect(gated["iv-fluid"]).toBe(0);
    expect(gated["defibrillator"]).toBe(0);
    expect(gated["analgesic-mild"]).toBe(60);
  });

  it("scales provider-class quantities by 0.6 for medium, keeps guided + self", () => {
    const probe = { "defibrillator": 1, "iv-fluid": 6, "analgesic-mild": 60 };
    const gated = gateAvailable(probe, "medium");
    expect(gated["defibrillator"]).toBeCloseTo(0.6, 10); // provider × 0.6
    expect(gated["iv-fluid"]).toBe(6);                   // guided × 1 (has video telemedicine)
    expect(gated["analgesic-mild"]).toBe(60);            // self × 1
  });

  it("defaults unknown resources to the self class (deliverability 1 everywhere)", () => {
    const gated = gateAvailable({ "made-up-item": 5 }, "none");
    expect(gated["made-up-item"]).toBe(5);
  });

  it("DELIVERABILITY rows for issHMS/unlimited are all 1", () => {
    for (const t of ["issHMS", "unlimited"] as const) {
      expect(DELIVERABILITY[t]).toEqual({ self: 1, guided: 1, provider: 1 });
    }
  });

  it("every issHMS resource key has a delivery-class assignment", () => {
    for (const k of Object.keys(IMM_KITS.issHMS.resources)) {
      expect(RESOURCE_DELIVERY_CLASS[k]).toBeDefined();
    }
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run tests/imm/health-support.test.ts`
Expected: FAIL — cannot resolve `../../src/imm/health-support`.

- [ ] **Step 3: Create `src/imm/health-support.ts`**

```ts
// src/imm/health-support.ts
// Health-Support feature (2026-05-28). Care-capability model layered over the
// existing kit resource vector. See docs/superpowers/specs/2026-05-28-health-support-categories-design.md
import type { IMMKitScenario, Telemedicine, CareProvider } from "./types";

export type DeliveryClass = "self" | "guided" | "provider";

/**
 * Per-tier × per-delivery-class deliverability weight ∈ [0,1].
 * issHMS and unlimited rows are all 1 → gateAvailable is identity → K15 gate
 * unchanged (spec §4.3). "medium" provider=0.6 is the single tunable,
 * levels-of-care-derived parameter (LoC III "limited surgical/ALS"; spec §4.2).
 * "custom" falls back to identity to preserve pre-existing custom-kit behaviour.
 */
export const DELIVERABILITY: Record<
  IMMKitScenario["scenarioId"],
  Record<DeliveryClass, number>
> = {
  none:      { self: 1, guided: 0,   provider: 0   }, // LoC I: audio only, no provider
  medium:    { self: 1, guided: 1,   provider: 0.6 }, // LoC II–III: video telemed + single austere physician
  issHMS:    { self: 1, guided: 1,   provider: 1   }, // LoC IV: identity (K15 baseline)
  unlimited: { self: 1, guided: 1,   provider: 1   }, // LoC V: identity
  custom:    { self: 1, guided: 1,   provider: 1   }, // identity (back-compat)
};

/**
 * Resource → delivery class. Derived from the NASA ISS pack structure
 * (OCHMO TB-006; HMS hardware report NTRS 20100042371): Convenience/Oral/Topical
 * med packs → self; injectables/IV/diagnostics/minor-treatment → guided;
 * ALSP / Physician-Equipment-Pack / defibrillation → provider.
 * NOTE: classification is reviewed by Diego (spec OQ1); it only affects the
 * none/medium tiers because issHMS/unlimited deliverability is identity.
 */
export const RESOURCE_DELIVERY_CLASS: Record<string, DeliveryClass> = {
  // self — oral / topical / checklist self-administration
  "antibiotic-broad-spectrum": "self", "antibiotic-narrow-spectrum": "self",
  "antibiotic-otic": "self", "antiviral": "self", "antifungal": "self",
  "analgesic-mild": "self", "analgesic-strong": "self",
  "antiemetic": "self", "antihistamine": "self", "decongestant": "self",
  "nasal-decongestant": "self", "antacid": "self", "antidiarrheal": "self",
  "laxative": "self", "oral-rehydration": "self", "scopolamine": "self",
  "topical-steroid": "self", "topical-antibiotic": "self",
  "eye-drops": "self", "ear-drops": "self", "antibiotic-eye": "self",
  "anticonvulsant": "self", "antidepressant": "self", "anti-anxiety": "self",
  "sleep-aid": "self", "antihypertensive": "self", "anticoagulant": "self",
  "hormonal-contraceptive": "self", "ophthalmic-antiglaucoma": "self",
  "burn-dressing": "self", "bandage-large": "self", "bandage-small": "self",
  "dental-temporary-filling": "self", "dental-filling-material": "self",
  "dental-crown-cement": "self",
  // guided — trained layperson under telemedicine guidance
  "opioid": "guided", "sedative": "guided", "muscle-relaxant": "guided",
  "iv-fluid": "guided", "suture-kit": "guided", "splint": "guided",
  "cervical-collar": "guided", "catheter-urinary": "guided",
  "ophthalmic-exam": "guided", "eye-irrigation-kit": "guided",
  "oxygen-supplemental": "guided", "antipsychotic": "guided",
  // provider — needs procedural skill / a provider present (ALS)
  "epinephrine": "provider", "atropine": "provider", "lidocaine": "provider",
  "antiarrhythmic": "provider", "defibrillator-pad": "provider",
  "defibrillator": "provider", "aed": "provider", "cardiac-monitor": "provider",
  "chest-tube": "provider",
};

/** Default class for any resource not explicitly mapped. */
export function classOf(resourceKey: string): DeliveryClass {
  return RESOURCE_DELIVERY_CLASS[resourceKey] ?? "self";
}

/**
 * Gate a resource vector by a tier's per-class deliverability weights.
 * effectiveAvailable[r] = available[r] × DELIVERABILITY[tierId][classOf(r)].
 * Identity for issHMS/unlimited/custom (all weights 1).
 */
export function gateAvailable(
  resources: Record<string, number>,
  tierId: IMMKitScenario["scenarioId"],
): Record<string, number> {
  const row = DELIVERABILITY[tierId] ?? DELIVERABILITY.custom;
  const out: Record<string, number> = {};
  for (const [k, q] of Object.entries(resources)) {
    out[k] = q * row[classOf(k)];
  }
  return out;
}

/** Deliverability lookup (UI uses this to dim undeliverable items). */
export function deliverability(
  cls: DeliveryClass,
  tierId: IMMKitScenario["scenarioId"],
): number {
  return (DELIVERABILITY[tierId] ?? DELIVERABILITY.custom)[cls];
}

// Re-export capability enums for UI typing convenience.
export type { Telemedicine, CareProvider };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/imm/health-support.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/imm/health-support.ts tests/imm/health-support.test.ts
git commit -m "feat(imm): delivery-class care-capability gating (gateAvailable)"
```

---

## Task 3: Wire `gateAvailable` into the engine (K15-safe)

**Files:**
- Modify: `src/imm/simulate.ts:249`

- [ ] **Step 1: Add a regression test that the K15 gate stays green**

This is the highest-risk step. The test asserts the engine produces identical issHMS output before/after. Add to `tests/imm/health-support.test.ts`:

```ts
import { simulateIMM } from "../../src/imm/simulate";
import { K15_REFERENCE_CREW } from "../../src/imm/calibration";
import { ACTIVE_MISSIONS } from "../../src/data/imm-missions";

describe("health-support engine integration", () => {
  const iss6 = ACTIVE_MISSIONS.find((m) => m.id === "iss-6mo")!;

  it("issHMS TME is unchanged by gating (identity → K15 safe)", () => {
    const out = simulateIMM({
      crew: K15_REFERENCE_CREW, mission: iss6,
      kit: IMM_KITS.issHMS, trials: 3000, seed: 0xc0ffee,
    });
    // issHMS gating is identity, so this matches the pre-feature seedwise result.
    // K15 TME envelope is [87,126]; assert we are inside it (loose, seed-stable).
    expect(out.tme.mean).toBeGreaterThan(87);
    expect(out.tme.mean).toBeLessThan(126);
  });

  it("medium CHI sits strictly between none and issHMS", () => {
    const opts = { crew: K15_REFERENCE_CREW, mission: iss6, trials: 4000, seed: 0xc0ffee };
    const none = simulateIMM({ ...opts, kit: IMM_KITS.none }).chi.mean;
    const medium = simulateIMM({ ...opts, kit: IMM_KITS.medium }).chi.mean;
    const iss = simulateIMM({ ...opts, kit: IMM_KITS.issHMS }).chi.mean;
    expect(medium).toBeGreaterThan(none);
    expect(medium).toBeLessThan(iss);
  });
});
```

(This test depends on `IMM_KITS.medium` from Task 4; if running Task 3 first, the second `it` will fail to resolve `medium` — that's expected until Task 4. Mark it `it.skip` until Task 4, then un-skip in Task 4 Step 4.)

- [ ] **Step 2: Run to confirm the first test currently passes (pre-wiring baseline)**

Run: `npx vitest run tests/imm/health-support.test.ts -t "issHMS TME is unchanged"`
Expected: PASS (engine already produces in-envelope TME; this locks the baseline before we touch simulate.ts).

- [ ] **Step 3: Wire the gating into `simulate.ts`**

In `src/imm/simulate.ts`, add the import near the other `./` imports (top of file, alongside the `./types` import):

```ts
import { gateAvailable } from "./health-support";
```

Then change line 249 from:

```ts
  const availableResources: Record<string, number> = { ...kit.resources };
```

to:

```ts
  // Health-Support gating: scale each resource by the tier's per-delivery-class
  // deliverability before RAF. Identity for issHMS/unlimited (K15 invariant);
  // only bites for none/medium. See src/imm/health-support.ts.
  const availableResources: Record<string, number> = gateAvailable(kit.resources, kit.scenarioId);
```

- [ ] **Step 4: Run the full IMM test suite**

Run: `npx vitest run tests/imm/`
Expected: PASS (all existing tests unchanged — issHMS/unlimited gating is identity; `validation_k15.test.ts` green).

- [ ] **Step 5: Run the K15 validation gate**

Run: `npm run validate:imm`
Expected: exit 0, same TME/CHI/pEVAC/pLOCL figures as before this feature (issHMS/unlimited untouched). If any K15 bracket changes, STOP — the identity invariant is broken; check `DELIVERABILITY.issHMS`/`unlimited` are all 1 and `Number.POSITIVE_INFINITY × 1 === Infinity` holds (it does).

- [ ] **Step 6: Commit**

```bash
git add src/imm/simulate.ts tests/imm/health-support.test.ts
git commit -m "feat(imm): gate availableResources by care capability before RAF"
```

---

## Task 4: `IMM_KITS.medium` + tier/category data + cited sourcing doc

**Files:**
- Modify: `src/imm/kits.ts`
- Modify: `src/imm/health-support.ts` (append tier + category data)
- Create: `research/2026-05-28_health_support_sourcing.md`
- Modify: `tests/imm/health-support.test.ts` (un-skip the medium test)

- [ ] **Step 1: Write the cited sourcing doc**

Create `research/2026-05-28_health_support_sourcing.md` (every `source_ref` used below resolves to an anchor here). Minimum content — fill DOIs/IDs from the spec §8 anchor list, one entry per source:

```markdown
# Health-Support sourcing (2026-05-28)

All kit items and tier capabilities below trace to a real, retrievable source.
No fabricated data (Diego's directive, 2026-05-28).

## Levels of care
- `loc-std3001` — NASA-STD-3001 Vol 1 (Crew Health), five levels of care.
- `loc-conops-mars` — Medical System ConOps for Mars Exploration, NASA NTRS 20200001715 (verbatim LoC I–V).
- `loc-hamilton2008` — Hamilton DR et al. Autonomous medical care for exploration class space missions. J Trauma 2008. NTRS 20070032039.
- `loc-neis2014` — Neis & Klaus 2014, mission→level mapping (ISS = LoC IV).

## ISS kit contents
- `iss-3001kit` — NASA "3.001 Medical Kit — Contents & Reference" (SpX-6, 2015).
- `iss-ochmo-tb006` — NASA OCHMO TB-006 "Pharmaceutical Care" (nine packs, ~190 meds).
- `iss-hms-ntrs` — HMS Hardware Research/Design, NASA NTRS 20100042371 (ALSP/AMP/PEP).
- `iss-diaz2024` — Diaz TE et al. Expiration analysis of the ISS formulary. npj Microgravity 2024 (DOI 10.1038/s41526-024-...; 106-med 2023 formulary).
- `iss-blue2019` — Blue RS et al. Supplying a pharmacy for NASA exploration spaceflight. npj Microgravity 2019.
- `iss-wotring2015` — Wotring VE. Medication use by U.S. crewmembers on the ISS. FASEB J 2015.

## Telemedicine + provider
- `tele-doarn2016` — Doarn CR et al. Principles of Crew Health Monitoring and Care (telemedicine listed as a resource category).
- `tele-csa` — CSA Medical Support (weekly PMC; flight surgeon trains CMO).
- `cmo-hailey2011` — Hailey M et al. Evaluating the ISS Medical Kit System (2 CMOs/crew, non-physician).
- `cmo-pmc5765846` — Medical judgement analogue studies, CMO (40–70 h training).

## Medium / Antarctic analog
- `analog-lugg1999` — Lugg DJ. Telemedical experiences at an Antarctic station. (PMID 10534856.)
- `analog-carmm` — Australian Antarctic Division Polar Medicine Unit / CARMM (sole station doctor, telehealth, point-of-care diagnostics).
- `analog-concordia` — ESA Concordia ("White Mars") station-physician model.
- `analog-pattarini2016` — Pattarini JM et al. (already in paper/references.bib).
```

- [ ] **Step 2: Add `IMM_KITS.medium` and capabilities to `kits.ts`**

In `src/imm/kits.ts`, after `issHmsResources` and before `IMM_KITS`, add the cited Medium subset (oral/topical/basic-procedure items a single austere physician carries — a strict subset of issHmsResources keys):

```ts
/**
 * Medium tier — analog/Antarctic-station capability (NASA LoC II–III).
 * Subset of issHMS: self-administrable + guided meds + basic procedures a single
 * station physician carries; no sustained ALS hardware. Cited:
 * research/2026-05-28_health_support_sourcing.md (analog-lugg1999, analog-carmm,
 * analog-concordia, loc-conops-mars). Quantities scaled to a small crew.
 */
const mediumResources: Record<string, number> = {
  "antibiotic-broad-spectrum": 20, "antibiotic-narrow-spectrum": 10,
  "antiviral": 5, "antifungal": 5, "analgesic-mild": 40, "analgesic-strong": 8,
  "antiemetic": 10, "antihistamine": 20, "decongestant": 10, "antacid": 20,
  "antidiarrheal": 10, "laxative": 10, "oral-rehydration": 10, "scopolamine": 10,
  "topical-steroid": 10, "topical-antibiotic": 10, "eye-drops": 10, "ear-drops": 10,
  "sleep-aid": 10, "anti-anxiety": 8, "antidepressant": 20, "anticonvulsant": 20,
  "antihypertensive": 20, "hormonal-contraceptive": 20,
  "burn-dressing": 6, "bandage-large": 15, "bandage-small": 40,
  "dental-temporary-filling": 4, "dental-filling-material": 2,
  // guided (deliverable under medium's video telemedicine)
  "iv-fluid": 4, "suture-kit": 3, "splint": 4, "cervical-collar": 1,
  "catheter-urinary": 2, "oxygen-supplemental": 1,
  // a single defibrillator/AED present but provider-class → ×0.6 effective
  "aed": 1, "epinephrine": 2,
};
```

Then update the `IMM_KITS` object to add `medium` and attach identity-safe `capabilities` to all entries:

```ts
export const IMM_KITS: Record<"none"|"medium"|"issHMS"|"unlimited", IMMKitScenario> = {
  none: {
    scenarioId: "none", label: "No Medical Resources", resources: {},
    capabilities: { telemedicine: "audio", provider: "none" },
  },
  medium: {
    scenarioId: "medium", label: "Analog / Antarctic Station (Level II–III)",
    resources: mediumResources,
    capabilities: { telemedicine: "video", provider: "physician" },
  },
  issHMS: {
    scenarioId: "issHMS", label: "ISS Health Maintenance System", resources: issHmsResources,
    capabilities: { telemedicine: "video", provider: "cmo" },
  },
  unlimited: {
    scenarioId: "unlimited", label: "Unlimited Medical Resources",
    resources: buildUnlimitedKitResources(),
    capabilities: { telemedicine: "video", provider: "physician" },
  },
};
```

(`buildUnlimitedKitResources()` only iterates `issHmsResources` keys; Medium adds no new keys, so `unlimited` is unaffected — K15 safe.)

- [ ] **Step 3: Append tier + category display data to `health-support.ts`**

```ts
import { IMM_KITS } from "./kits";

export interface HealthSupportItem {
  id: string;            // resource key (matches issHmsResources)
  label: string;         // human-readable (e.g., "Ondansetron (Zofran)")
  category: "medications" | "procedures";
  packClass?: string;    // NASA pack class for grouping
  deliveryClass: DeliveryClass;
  source_ref: string;    // → research/2026-05-28_health_support_sourcing.md
}

export interface HealthSupportTier {
  tierId: IMMKitScenario["scenarioId"];
  label: string;
  levelOfCare: "I" | "II–III" | "IV" | "V";
  summary: string;
  capabilities: { telemedicine: Telemedicine; provider: CareProvider };
  source_ref: string;
}

export const HEALTH_SUPPORT_TIERS: HealthSupportTier[] = [
  { tierId: "none", label: "None", levelOfCare: "I",
    summary: "Self/buddy first aid + basic life support; private audio only. No formulary, no provider.",
    capabilities: IMM_KITS.none.capabilities!, source_ref: "loc-conops-mars" },
  { tierId: "medium", label: "Medium (Analog / Antarctic)", levelOfCare: "II–III",
    summary: "Single station physician + video telemedicine + point-of-care diagnostics; limited ALS/surgery, no resupply.",
    capabilities: IMM_KITS.medium.capabilities!, source_ref: "analog-carmm" },
  { tierId: "issHMS", label: "ISS (HMS)", levelOfCare: "IV",
    summary: "Crew Medical Officer + weekly PMC telemedicine; full nine-pack formulary, sustainable ALS, limited surgery, imaging.",
    capabilities: IMM_KITS.issHMS.capabilities!, source_ref: "iss-ochmo-tb006" },
  { tierId: "unlimited", label: "Unlimited", levelOfCare: "V",
    summary: "Theoretical ceiling: autonomous advanced life support, ambulatory and basic surgical care.",
    capabilities: IMM_KITS.unlimited.capabilities!, source_ref: "loc-conops-mars" },
];

/**
 * Curated, cited item catalogue for the breakdown UI. This is a representative
 * (not exhaustive) labelled view of the resource keys, grouped by NASA pack class.
 * Every entry carries a source_ref. Extend as needed; keys must exist in
 * issHmsResources / RESOURCE_DELIVERY_CLASS.
 */
export const HEALTH_SUPPORT_ITEMS: HealthSupportItem[] = [
  // medications — Oral/Convenience Med Pack (self)
  { id: "antibiotic-broad-spectrum", label: "Broad-spectrum antibiotic (e.g., Augmentin)", category: "medications", packClass: "Oral Med Pack", deliveryClass: "self", source_ref: "iss-3001kit" },
  { id: "antiviral", label: "Valacyclovir (Valtrex)", category: "medications", packClass: "Oral Med Pack", deliveryClass: "self", source_ref: "iss-3001kit" },
  { id: "antiemetic", label: "Ondansetron (Zofran) / Meclizine", category: "medications", packClass: "Oral Med Pack", deliveryClass: "self", source_ref: "iss-3001kit" },
  { id: "sleep-aid", label: "Sleep aid (most-used class on ISS)", category: "medications", packClass: "Oral Med Pack", deliveryClass: "self", source_ref: "iss-wotring2015" },
  { id: "anti-anxiety", label: "Lorazepam (Ativan)", category: "medications", packClass: "Behavioral Health", deliveryClass: "self", source_ref: "iss-3001kit" },
  { id: "analgesic-strong", label: "Strong analgesic", category: "medications", packClass: "Oral Med Pack", deliveryClass: "self", source_ref: "iss-3001kit" },
  // medications — Topical & Injectable (guided/provider)
  { id: "iv-fluid", label: "IV fluid (saline)", category: "medications", packClass: "IV Supply Pack", deliveryClass: "guided", source_ref: "iss-hms-ntrs" },
  { id: "epinephrine", label: "Epinephrine (ACLS)", category: "medications", packClass: "Emergency Medical Pack", deliveryClass: "provider", source_ref: "iss-hms-ntrs" },
  // procedures & equipment
  { id: "suture-kit", label: "Minor surgical / suture kit", category: "procedures", packClass: "Minor Treatment Pack", deliveryClass: "guided", source_ref: "iss-hms-ntrs" },
  { id: "defibrillator", label: "Defibrillator / AED (ECG, pacing)", category: "procedures", packClass: "Advanced Life Support Pack", deliveryClass: "provider", source_ref: "iss-hms-ntrs" },
  { id: "oxygen-supplemental", label: "Respiratory Support Pack (ventilation, O₂)", category: "procedures", packClass: "Respiratory Support Pack", deliveryClass: "guided", source_ref: "iss-hms-ntrs" },
  { id: "cardiac-monitor", label: "Cardiac monitor / Physician Equipment Pack", category: "procedures", packClass: "Physician Equipment Pack", deliveryClass: "provider", source_ref: "iss-hms-ntrs" },
];
```

- [ ] **Step 4: Un-skip the medium engine test and run**

In `tests/imm/health-support.test.ts`, change the `it.skip("medium CHI sits strictly...")` (if you skipped it in Task 3) back to `it(...)`. Run:

Run: `npx vitest run tests/imm/health-support.test.ts`
Expected: PASS (medium CHI strictly between none and issHMS).

- [ ] **Step 5: Re-run the K15 gate (medium must not perturb it)**

Run: `npm run validate:imm`
Expected: exit 0, unchanged figures (medium adds no keys to issHMS/unlimited).

- [ ] **Step 6: Commit**

```bash
git add src/imm/kits.ts src/imm/health-support.ts research/2026-05-28_health_support_sourcing.md tests/imm/health-support.test.ts
git commit -m "feat(imm): add cited Medium tier + health-support tier/category data"
```

---

## Task 5: `HealthSupportTierPicker` component

**Files:**
- Create: `src/ui/health/HealthSupportTierPicker.tsx`
- Test: `tests/ui/health-support.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/ui/health-support.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HealthSupportTierPicker } from "../../src/ui/health/HealthSupportTierPicker";
import { IMM_KITS } from "../../src/imm/kits";

describe("HealthSupportTierPicker", () => {
  it("renders all four tiers and fires onSelect with the kit", () => {
    const onSelect = vi.fn();
    render(<HealthSupportTierPicker selectedId="issHMS" onSelect={onSelect} />);
    expect(screen.getByText(/None/)).toBeInTheDocument();
    expect(screen.getByText(/Medium/)).toBeInTheDocument();
    expect(screen.getByText(/ISS/)).toBeInTheDocument();
    expect(screen.getByText(/Unlimited/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /Medium/i }));
    expect(onSelect).toHaveBeenCalledWith(IMM_KITS.medium);
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npx vitest run tests/ui/health-support.test.tsx`
Expected: FAIL — cannot resolve the component.

- [ ] **Step 3: Create the component**

```tsx
// src/ui/health/HealthSupportTierPicker.tsx
import { HEALTH_SUPPORT_TIERS } from "../../imm/health-support";
import { IMM_KITS } from "../../imm/kits";
import type { IMMKitScenario } from "../../imm/types";

type Props = {
  selectedId: IMMKitScenario["scenarioId"];
  onSelect: (kit: IMMKitScenario) => void;
};

const TELE_LABEL = { none: "no telemed", audio: "audio", video: "video telemed" } as const;
const PROV_LABEL = { none: "no provider", cmo: "CMO", physician: "physician" } as const;

export function HealthSupportTierPicker({ selectedId, onSelect }: Props) {
  return (
    <div role="radiogroup" aria-label="Health support tier" className="grid grid-cols-2 gap-2">
      {HEALTH_SUPPORT_TIERS.map((t) => {
        const active = selectedId === t.tierId;
        const kit = IMM_KITS[t.tierId as "none" | "medium" | "issHMS" | "unlimited"];
        return (
          <button
            key={t.tierId}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t.label}
            onClick={() => onSelect(kit)}
            className={
              "panel relative text-left p-3 transition-all duration-150 cursor-pointer " +
              (active
                ? "border-signal bg-signal/5 ring-1 ring-signal/40 shadow-[0_0_24px_rgba(245,181,65,0.18)]"
                : "hover:border-line-2 hover:bg-bg-2")
            }
          >
            <div className="mono text-[9px] uppercase tracking-cap text-ink-3 mb-1">
              Level of Care {t.levelOfCare}
            </div>
            <div className="display text-sm text-ink-0 leading-tight">{t.label}</div>
            <div className="mono text-[10px] text-ink-2 mt-1 flex flex-wrap gap-x-2">
              <span>{TELE_LABEL[t.capabilities.telemedicine]}</span>
              <span>·</span>
              <span>{PROV_LABEL[t.capabilities.provider]}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/ui/health-support.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/health/HealthSupportTierPicker.tsx tests/ui/health-support.test.tsx
git commit -m "feat(ui): HealthSupportTierPicker card grid"
```

---

## Task 6: `HealthSupportBreakdown` component (cited, dims undeliverable)

**Files:**
- Create: `src/ui/health/HealthSupportBreakdown.tsx`
- Test: append to `tests/ui/health-support.test.tsx`

- [ ] **Step 1: Write the failing test (append)**

```tsx
import { HealthSupportBreakdown } from "../../src/ui/health/HealthSupportBreakdown";

describe("HealthSupportBreakdown", () => {
  it("shows capability categories and dims undeliverable items for None", () => {
    render(<HealthSupportBreakdown tierId="none" />);
    // Telemedicine + provider summaries present
    expect(screen.getByText(/Telemedicine/i)).toBeInTheDocument();
    expect(screen.getByText(/Onboard provider/i)).toBeInTheDocument();
    // a provider-class item (defibrillator) is marked not-deliverable under none
    expect(screen.getByText(/Defibrillator/i).closest("[data-deliverable]"))
      .toHaveAttribute("data-deliverable", "false");
  });

  it("marks the same item deliverable for ISS", () => {
    render(<HealthSupportBreakdown tierId="issHMS" />);
    expect(screen.getByText(/Defibrillator/i).closest("[data-deliverable]"))
      .toHaveAttribute("data-deliverable", "true");
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npx vitest run tests/ui/health-support.test.tsx -t "HealthSupportBreakdown"`
Expected: FAIL — component missing.

- [ ] **Step 3: Create the component**

```tsx
// src/ui/health/HealthSupportBreakdown.tsx
import {
  HEALTH_SUPPORT_TIERS, HEALTH_SUPPORT_ITEMS, deliverability,
} from "../../imm/health-support";
import type { IMMKitScenario } from "../../imm/types";

type Props = { tierId: IMMKitScenario["scenarioId"] };

function CategoryHeader({ children }: { children: React.ReactNode }) {
  return <h4 className="label text-[10px] text-ink-2 uppercase tracking-cap mt-3 mb-1">{children}</h4>;
}

export function HealthSupportBreakdown({ tierId }: Props) {
  const tier = HEALTH_SUPPORT_TIERS.find((t) => t.tierId === tierId)!;
  const meds = HEALTH_SUPPORT_ITEMS.filter((i) => i.category === "medications");
  const procs = HEALTH_SUPPORT_ITEMS.filter((i) => i.category === "procedures");

  const Item = ({ item }: { item: typeof HEALTH_SUPPORT_ITEMS[number] }) => {
    const deliver = deliverability(item.deliveryClass, tierId) > 0;
    return (
      <div
        data-deliverable={deliver ? "true" : "false"}
        className={"flex items-center justify-between gap-2 mono text-[11px] py-0.5 " +
          (deliver ? "text-ink-1" : "text-ink-3 line-through/30 opacity-50")}
      >
        <span>{item.label}</span>
        <span className="flex items-center gap-1.5">
          {!deliver && <span className="text-[9px] uppercase text-warn">needs {item.deliveryClass}</span>}
          <span className="text-[9px] text-ink-3" title={item.source_ref}>[{item.source_ref}]</span>
        </span>
      </div>
    );
  };

  return (
    <div className="panel flex flex-col gap-1 text-left">
      <CategoryHeader>Telemedicine / ground support</CategoryHeader>
      <p className="mono text-[11px] text-ink-1">{tier.capabilities.telemedicine} · ground flight-surgeon link</p>
      <CategoryHeader>Onboard provider</CategoryHeader>
      <p className="mono text-[11px] text-ink-1">{tier.capabilities.provider}</p>
      <CategoryHeader>Medication formulary</CategoryHeader>
      {meds.map((i) => <Item key={i.id} item={i} />)}
      <CategoryHeader>Procedures &amp; equipment</CategoryHeader>
      {procs.map((i) => <Item key={i.id} item={i} />)}
      <p className="mono text-[9px] text-ink-3 mt-2">Sources → research/2026-05-28_health_support_sourcing.md</p>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/ui/health-support.test.tsx -t "HealthSupportBreakdown"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/health/HealthSupportBreakdown.tsx tests/ui/health-support.test.tsx
git commit -m "feat(ui): HealthSupportBreakdown with cited items + deliverability dimming"
```

---

## Task 7: `HealthSupportSeverityReadout` component (live, via worker)

**Files:**
- Create: `src/ui/health/HealthSupportSeverityReadout.tsx`
- Test: append to `tests/ui/health-support.test.tsx`

- [ ] **Step 1: Write the failing test (append)**

The component takes already-computed outcomes as props (the worker is owned by the parent view — keeps the component pure and testable):

```tsx
import { HealthSupportSeverityReadout } from "../../src/ui/health/HealthSupportSeverityReadout";

describe("HealthSupportSeverityReadout", () => {
  it("renders CHI and a delta vs the ISS baseline", () => {
    render(
      <HealthSupportSeverityReadout
        tierLabel="Medium (Analog / Antarctic)"
        chiMean={75.4}
        issBaselineChi={82.8}
        verdictColor="yellow"
        verdictScore={18}
      />,
    );
    expect(screen.getByText(/75\.4/)).toBeInTheDocument();
    expect(screen.getByText(/−7\.4|−7\.40|-7\.4/)).toBeInTheDocument(); // delta vs ISS
    expect(screen.getByText(/yellow/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npx vitest run tests/ui/health-support.test.tsx -t "HealthSupportSeverityReadout"`
Expected: FAIL — component missing.

- [ ] **Step 3: Create the component**

```tsx
// src/ui/health/HealthSupportSeverityReadout.tsx
type Props = {
  tierLabel: string;
  chiMean: number;            // percent scale 0–100
  issBaselineChi: number;     // percent scale 0–100
  verdictColor: "green" | "yellow" | "red";
  verdictScore: number;
};

const CHIP = {
  green: "text-emerald-300 border-emerald-500/40",
  yellow: "text-amber-300 border-amber-500/40",
  red: "text-warn border-warn/40",
} as const;

export function HealthSupportSeverityReadout({
  tierLabel, chiMean, issBaselineChi, verdictColor, verdictScore,
}: Props) {
  const delta = chiMean - issBaselineChi;
  const sign = delta >= 0 ? "+" : "−";
  return (
    <div className="panel flex flex-col gap-2">
      <h4 className="label text-[10px] text-ink-2 uppercase tracking-cap">Severity · {tierLabel}</h4>
      <div className="flex items-baseline gap-3">
        <span className="display text-2xl text-ink-0 tabular-nums">{chiMean.toFixed(1)}</span>
        <span className="mono text-[11px] text-ink-2">CHI %</span>
        <span className="mono text-[11px] text-ink-3">
          {sign}{Math.abs(delta).toFixed(1)} vs ISS
        </span>
      </div>
      <div className={"mono text-[10px] inline-block self-start px-1.5 py-0.5 border rounded-sm uppercase tracking-cap " + CHIP[verdictColor]}>
        HSRB {verdictColor} · score {verdictScore}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/ui/health-support.test.tsx -t "HealthSupportSeverityReadout"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/health/HealthSupportSeverityReadout.tsx tests/ui/health-support.test.tsx
git commit -m "feat(ui): HealthSupportSeverityReadout (CHI + delta vs ISS + verdict chip)"
```

---

## Task 8: Mount the panel in `CrewComposition.tsx`

**Files:**
- Modify: `src/ui/views/CrewComposition.tsx` (state type ~111; kit row ~348-368; imports)

- [ ] **Step 1: Change the kit state type to `IMMKitScenario`**

In `src/ui/views/CrewComposition.tsx`, line 111, change:

```ts
  kit: typeof IMM_KITS["issHMS"];
```
to:
```ts
  kit: IMMKitScenario;
```

Add the import (with the other `../../imm` imports near the top):

```ts
import type { IMMKitScenario } from "../../imm/types";
import { HealthSupportTierPicker } from "../health/HealthSupportTierPicker";
import { HealthSupportBreakdown } from "../health/HealthSupportBreakdown";
```

- [ ] **Step 2: Replace the three-button kit row**

Replace the block at lines ~348–368 (the `{/* Kit selector */}` div through its closing `</div>`) with:

```tsx
            {/* Health-support tier selector (Health-Support feature) */}
            <div className="flex flex-col gap-1.5">
              <label className="label text-[10px] text-ink-2 uppercase tracking-cap">Health Support</label>
              <HealthSupportTierPicker
                selectedId={state.kit.scenarioId}
                onSelect={(kit) => { setState((s) => ({ ...s, kit })); setOutcome(undefined); setSimState("idle"); }}
              />
              <HealthSupportBreakdown tierId={state.kit.scenarioId} />
            </div>
```

- [ ] **Step 3: Typecheck + unit tests**

Run: `npm run typecheck && npm test`
Expected: PASS. (`state.kit` is now `IMMKitScenario`; the worker payload `kit: state.kit` and the K15-badge guard `state.kit.scenarioId !== "custom"` still typecheck. The K15 badge only renders for `none/issHMS/unlimited` on `iss-6mo`; `medium` correctly shows no badge.)

- [ ] **Step 4: (Optional, recommended) wire the live severity readout**

If wiring `HealthSupportSeverityReadout` live: after a sim completes, the view already has `outcome` and `lxc`. Render it under the breakdown using `outcome.chi.mean`, a stored ISS-baseline CHI (run once on mount or hardcode the documented 82.8 with a `source_ref` comment), and `lxc.color`/`lxc.score`. Defer if time-boxed — the breakdown already shows differentiation.

- [ ] **Step 5: Commit**

```bash
git add src/ui/views/CrewComposition.tsx
git commit -m "feat(ui): mount Health Support tier picker + breakdown in CrewComposition"
```

---

## Task 9: End-to-end verification

**Files:**
- Create: `tests/e2e/health-support.spec.ts`

- [ ] **Step 1: Write the e2e test**

```ts
import { test, expect } from "@playwright/test";

test("selecting a health-support tier updates the breakdown", async ({ page }) => {
  await page.goto("/");
  // navigate to Crew Composition view (adjust selector to the app's nav)
  await page.getByRole("link", { name: /crew composition/i }).click().catch(() => {});
  const medium = page.getByRole("radio", { name: /Medium/i });
  await medium.click();
  await expect(medium).toHaveAttribute("aria-checked", "true");
  // a provider-class item is dimmed/limited under Medium
  await expect(page.getByText(/Defibrillator/i)).toBeVisible();
});
```

- [ ] **Step 2: Run e2e**

Run: `npm run e2e -- tests/e2e/health-support.spec.ts`
Expected: PASS (adjust the nav selector if the app routes differently; the radiogroup + breakdown must render).

- [ ] **Step 3: Full verification sweep**

Run: `npm run typecheck && npm test && npm run validate:imm`
Expected: typecheck clean; all vitest green; `validate:imm` exit 0 with **unchanged** K15 figures (the load-bearing invariant).

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/health-support.spec.ts
git commit -m "test(e2e): health-support tier switch"
```

- [ ] **Step 5: Update STATUS.md**

Append an audit-log row to `STATUS.md` recording the feature, the K15-invariant guarantee, and the commit SHAs. Commit:

```bash
git add STATUS.md
git commit -m "docs: STATUS — health-support categories feature complete"
```

---

## Self-review notes (author)

- **Spec coverage:** §3 categories → Tasks 4,6; §3.2 tiers → Task 4; §4 severity model → Tasks 2,3; §5 data/provenance → Tasks 2,4; §6 V&V → Tasks 3,9; §7 frontend → Tasks 5,6,7,8; §8 sourcing → Task 4. All covered.
- **K15 invariant** is asserted at three checkpoints (Task 3 Step 5, Task 4 Step 5, Task 9 Step 3) — the controlling risk.
- **Type consistency:** `gateAvailable(resources, tierId)`, `deliverability(cls, tierId)`, `IMMKitScenario.scenarioId` (incl. `"medium"`), `HEALTH_SUPPORT_TIERS`/`HEALTH_SUPPORT_ITEMS` are used identically across tasks.
- **Open item carried from spec:** exact `RESOURCE_DELIVERY_CLASS` assignments (OQ1) — drafted in Task 2 Step 3, flagged for Diego's review; does not affect K15 (issHMS deliverability is identity).
