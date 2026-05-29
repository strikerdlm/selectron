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
  none:      { self: 1, guided: 0,   provider: 0   },
  medium:    { self: 1, guided: 1,   provider: 0.6 },
  issHMS:    { self: 1, guided: 1,   provider: 1   },
  unlimited: { self: 1, guided: 1,   provider: 1   },
  custom:    { self: 1, guided: 1,   provider: 1   },
};

/**
 * Resource → delivery class. Derived from the NASA ISS pack structure
 * (OCHMO TB-006; HMS hardware report NTRS 20100042371): Convenience/Oral/Topical
 * med packs → self; injectables/IV/diagnostics/minor-treatment → guided;
 * ALSP / Physician-Equipment-Pack / defibrillation → provider.
 * NOTE: classification reviewed by Diego (spec OQ1); it only affects the
 * none/medium tiers because issHMS/unlimited deliverability is identity.
 */
export const RESOURCE_DELIVERY_CLASS: Record<string, DeliveryClass> = {
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
  "opioid": "guided", "sedative": "guided", "muscle-relaxant": "guided",
  "iv-fluid": "guided", "suture-kit": "guided", "splint": "guided",
  "cervical-collar": "guided", "catheter-urinary": "guided",
  "ophthalmic-exam": "guided", "eye-irrigation-kit": "guided",
  "oxygen-supplemental": "guided", "antipsychotic": "guided",
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
