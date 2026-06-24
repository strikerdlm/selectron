import type { IMMConditionFamily, IMMMission } from "./types";
import { PROFILE_EFFECTS, type ProfileEffectMode } from "./profile-effects";

const BEHAVIORAL_PSYCH_FAMILIES = new Set<IMMConditionFamily>(["behavioral", "psychiatric"]);

/**
 * Incidence multiplier from the profile-effect registry. In adjudicated mode
 * this function only applies accepted effects; proposal effects such as the
 * current communications-delay sensitivity coefficient require explicit
 * exploratory mode.
 */
export function profileIncidenceMultiplier(
  mission: IMMMission,
  family: IMMConditionFamily,
  mode: ProfileEffectMode = "adjudicated",
): number {
  if (mode === "off") return 1.0;
  if (!BEHAVIORAL_PSYCH_FAMILIES.has(family)) return 1.0;

  const effect = PROFILE_EFFECTS.find(
    (e) =>
      e.profilePath === "profile.communication.delaySec" &&
      e.target === "incidence" &&
      (mode === "exploratory" ? e.evidenceStatus !== "unsupported" : e.evidenceStatus === "accepted") &&
      e.estimate !== null,
  );
  if (!effect || effect.estimate === null) return 1.0;

  const delaySec = mission.profile?.communication.delaySec ?? 0;
  if (!Number.isFinite(delaySec) || delaySec <= 0) return 1.0;

  const delayMin = delaySec / 60;
  const log10Delay = Math.log10(1 + delayMin);
  return Math.exp(effect.estimate * log10Delay);
}
