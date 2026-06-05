// src/imm/kits.ts
import type { IMMKitScenario } from "./types";

const issHmsResources: Record<string, number> = {
  // Antibiotics / antivirals / antifungals
  "antibiotic-broad-spectrum": 30, "antibiotic-narrow-spectrum": 14,
  "antibiotic-otic": 10, "antiviral": 7, "antifungal": 7,
  // Analgesics / sedation
  "analgesic-mild": 60, "analgesic-strong": 14, "opioid": 7,
  "muscle-relaxant": 10, "sedative": 10,
  // GI / allergy / ENT
  "antiemetic": 14, "antihistamine": 28, "decongestant": 14,
  "nasal-decongestant": 14, "antacid": 28, "antidiarrheal": 14,
  "laxative": 14, "oral-rehydration": 14, "scopolamine": 14,
  // Topicals / dermatology
  "topical-steroid": 14, "topical-antibiotic": 14,
  "eye-drops": 14, "ear-drops": 14,
  // Cardiovascular / hematology
  "iv-fluid": 6, "epinephrine": 4, "atropine": 4, "lidocaine": 6,
  "antiarrhythmic": 14, "anticoagulant": 30, "antihypertensive": 30,
  // Neurology / psychiatry
  "anticonvulsant": 30, "antidepressant": 30,
  "anti-anxiety": 14, "sleep-aid": 14, "antipsychotic": 4,
  // Ophthalmic
  "antibiotic-eye": 6, "ophthalmic-antiglaucoma": 14, "ophthalmic-exam": 1,
  "eye-irrigation-kit": 2,
  // Equipment / procedural
  "defibrillator-pad": 4, "defibrillator": 1, "aed": 1, "cardiac-monitor": 1,
  "suture-kit": 4, "splint": 6, "cervical-collar": 1,
  "catheter-urinary": 4, "chest-tube": 2,
  // Wound care / trauma
  "burn-dressing": 8, "bandage-large": 20, "bandage-small": 50,
  // Dental
  "dental-temporary-filling": 6, "dental-filling-material": 2, "dental-crown-cement": 2,
  // Gynecology
  "hormonal-contraceptive": 30,
  // Respiratory / environmental
  "oxygen-supplemental": 2,
};

/**
 * Unlimited kit: concrete Record mapping every resource name known to issHMS
 * (plus any in priors) to Infinity. Replaces the old Proxy which lacked an
 * ownKeys trap — spreading `{ ...proxy }` returned {} and silently behaved
 * like the empty "none" kit.
 *
 * Built as a copy of issHmsResources with every value set to Infinity so that
 * `{ ...IMM_KITS.unlimited.resources }` produces a proper copy in runIMMTrial.
 */
function buildUnlimitedKitResources(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const k of Object.keys(issHmsResources)) {
    result[k] = Number.POSITIVE_INFINITY;
  }
  return result;
}

/**
 * Medium tier - analog/Antarctic-station capability (NASA LoC II-III).
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
  "iv-fluid": 4, "suture-kit": 3, "splint": 4, "cervical-collar": 1,
  "catheter-urinary": 2, "oxygen-supplemental": 1,
  "aed": 1, "epinephrine": 2,
};

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

export function computeRAF(
  required: Record<string, number>,
  available: Record<string, number>,
): number {
  const keys = Object.keys(required);
  if (keys.length === 0) return 1;
  let totalRequired = 0;
  let totalAvailable = 0;
  for (const k of keys) {
    totalRequired += required[k];
    totalAvailable += Math.min(required[k], available[k] ?? 0);
  }
  return totalRequired > 0 ? totalAvailable / totalRequired : 1;
}

export function customKit(overrides: Record<string, number>): IMMKitScenario {
  return {
    scenarioId: "custom",
    label: "Custom",
    resources: { ...IMM_KITS.issHMS.resources, ...overrides },
  };
}
