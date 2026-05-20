// src/data/imm-missions.ts
import type { IMMMission } from "../imm/types";

export const IMM_MISSIONS: IMMMission[] = [
  // K15 reference
  { id: "iss-6mo", label: "ISS 6 month (K15 reference)",
    durationDays: 180, crewSize: 6, totalEVAs: 12,
    evaSchedule: [30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 170, 175] },
  // S20 references
  { id: "iss-drm1", label: "ISS DRM1 (S20)",
    durationDays: 365, crewSize: 6, totalEVAs: 20,
    evaSchedule: Array.from({length: 20}, (_, i) => Math.round((i + 1) * 365 / 21)) },
  { id: "iss-drm2", label: "ISS DRM2 (S20)",
    durationDays: 180, crewSize: 6, totalEVAs: 10,
    evaSchedule: Array.from({length: 10}, (_, i) => Math.round((i + 1) * 180 / 11)) },
  // TM21 Mars
  { id: "amm-426d", label: "Accelerated Mars Mission (TM21 AMM)",
    durationDays: 426, crewSize: 4, totalEVAs: 60,
    evaSchedule: Array.from({length: 60}, (_, i) => 180 + Math.floor(i / 2)) },
  { id: "smm-923d", label: "Standard Mars Mission (TM21 SMM)",
    durationDays: 923, crewSize: 4, totalEVAs: 401,
    evaSchedule: Array.from({length: 401}, (_, i) => 200 + Math.floor(i * 1.5)) },
  // 8 existing Selectron analog missions (parity for IMM-mode runs)
  { id: "mdrs-2wk", label: "MDRS 2-week rotation",
    durationDays: 14, crewSize: 6, totalEVAs: 6,
    evaSchedule: [3, 5, 7, 9, 11, 13] },
  { id: "short-7d", label: "Short MDRS (7 days)",
    durationDays: 7, crewSize: 6, totalEVAs: 3, evaSchedule: [2, 4, 6] },
  { id: "emmpol-6", label: "EMMPOL-6 (10 days)",
    durationDays: 10, crewSize: 6, totalEVAs: 4, evaSchedule: [2, 4, 6, 8] },
  { id: "hi-seas-45d", label: "HI-SEAS 45-day",
    durationDays: 45, crewSize: 6, totalEVAs: 8,
    evaSchedule: [5, 12, 18, 24, 30, 36, 40, 43] },
  { id: "short-22d", label: "THOR 22-day",
    durationDays: 22, crewSize: 6, totalEVAs: 5, evaSchedule: [4, 8, 12, 16, 20] },
  { id: "hi-seas-90d", label: "HI-SEAS 90-day",
    durationDays: 90, crewSize: 6, totalEVAs: 14,
    evaSchedule: Array.from({length: 14}, (_, i) => 6 + i * 6) },
  { id: "antarctic-winter", label: "Antarctic winter-over (365 d)",
    durationDays: 365, crewSize: 12, totalEVAs: 24,
    evaSchedule: Array.from({length: 24}, (_, i) => Math.round((i + 1) * 365 / 25)) },
  { id: "mars500", label: "Mars-500 (520 d)",
    durationDays: 520, crewSize: 6, totalEVAs: 30,
    evaSchedule: Array.from({length: 30}, (_, i) => Math.round((i + 1) * 520 / 31)) },
];
