import type {
  AnalogFieldExposureDisclosure,
  IMMCondition,
  IMMCrewMember,
  IMMMission,
} from "./types";

export const ANALOG_FIELD_EXPOSURE_PROCESS_FAMILIES = [
  "analog-field-exposure",
  "analog-terrain-EVA",
  "polar-outside-operation",
] as const;

export function buildAnalogFieldExposureDisclosure(opts: {
  mission: IMMMission;
  crew: readonly IMMCrewMember[];
  excludedSpaceEvaConditions: readonly IMMCondition[];
}): AnalogFieldExposureDisclosure {
  const crewEvaEventCount = opts.crew.reduce(
    (sum, member) => sum + (member.EVA_eligible ? Math.max(0, member.EVA_count) : 0),
    0,
  );
  return {
    id: "analog-field-exposure-gap-v1",
    label: "Analog field-EVA hazards not modeled",
    status: "not-modeled",
    evidenceStatus: "unsupported",
    appliesWhen: "terrestrial-analog",
    profileEvaType: opts.mission.profile?.eva.type ?? "unreported",
    crewEvaEventCount,
    missionTotalEVAs: opts.mission.totalEVAs,
    spaceEvaPriorsReused: false,
    excludedSpaceEvaConditionIds: opts.excludedSpaceEvaConditions.map((condition) => condition.id),
    omittedAnalogProcessFamilies: ANALOG_FIELD_EXPOSURE_PROCESS_FAMILIES,
    limitations: [
      "Pressurized-suit and orbital space-EVA priors are excluded for terrestrial analog missions.",
      "Terrain EVAs, polar fieldwork, habitat-egress, climbing, vehicle operations, and analog-suit activities are not represented by a separate terrestrial exposure family.",
      "Current terrestrial analog outputs therefore omit field-exposure injury and operational hazards unless they are already covered by ordinary non-EVA medical conditions.",
    ],
    requiredUpgrade:
      "Add analog-specific exposure denominators, event definitions, and adjudicated priors for analog-field-exposure, analog-terrain-EVA, and polar-outside-operation process families before treating terrestrial EVA risk as modeled.",
  };
}
