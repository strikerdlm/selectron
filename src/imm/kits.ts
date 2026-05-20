// src/imm/kits.ts
import type { IMMKitScenario } from "./types";

const issHmsResources: Record<string, number> = {
  "antibiotic-broad-spectrum": 30, "antibiotic-narrow-spectrum": 14,
  "antiviral": 7, "antifungal": 7,
  "analgesic-mild": 60, "analgesic-strong": 14, "opioid": 7,
  "antiemetic": 14, "antihistamine": 28, "decongestant": 14,
  "nasal-decongestant": 14, "antacid": 28, "antidiarrheal": 14,
  "laxative": 14, "topical-steroid": 14, "topical-antibiotic": 14,
  "eye-drops": 14, "ear-drops": 14, "oral-rehydration": 14,
  "iv-fluid": 6, "epinephrine": 4, "atropine": 4, "lidocaine": 6,
  "defibrillator-pad": 4, "suture-kit": 4, "splint": 6,
  "dental-temporary-filling": 6, "burn-dressing": 8,
  "bandage-large": 20, "bandage-small": 50,
  "antibiotic-eye": 6, "anti-anxiety": 14, "sleep-aid": 14,
  "antipsychotic": 4,
};

export const IMM_KITS: Record<"none"|"issHMS"|"unlimited", IMMKitScenario> = {
  none: { scenarioId: "none", label: "No Medical Resources", resources: {} },
  issHMS: { scenarioId: "issHMS", label: "ISS Health Maintenance System", resources: issHmsResources },
  unlimited: {
    scenarioId: "unlimited", label: "Unlimited Medical Resources",
    resources: new Proxy({}, { get: () => Number.POSITIVE_INFINITY }) as Record<string, number>,
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
