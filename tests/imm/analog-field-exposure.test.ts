import { describe, expect, it } from "vitest";
import {
  ANALOG_FIELD_EXPOSURE_PROCESS_FAMILIES,
  buildAnalogFieldExposureDisclosure,
} from "../../src/imm/analog-field-exposure";
import type { IMMCondition, IMMCrewMember, IMMMission } from "../../src/imm/types";

const mission: IMMMission = {
  id: "analog-field",
  label: "Analog field campaign",
  kind: "analog-controlled",
  durationDays: 30,
  crewSize: 1,
  totalEVAs: 3,
  evaSchedule: [5, 10, 20],
  profile: {
    habitat: { name: "Field habitat", privacyLevel: "shared", sleepingArrangement: "shared" },
    environment: {
      setting: "field-analog",
      hypoxia: "none",
      temperatureExposure: "variable",
      outsideExposure: "routine",
    },
    operations: {
      autonomyLevel: "moderate",
      workload: "high",
      shiftDesign: "day-shift",
      circadianLightControl: "natural",
      researchBurden: "moderate",
    },
    communication: {
      delaySec: 0,
      schedule: "scheduled",
      missionControl: "remote",
      supportTeam: "standard",
    },
    logistics: {
      resupply: "limited",
      foodConstraint: "moderate",
      hygieneConstraint: "moderate",
    },
    medicalSupport: {
      provider: "cmo",
      telemedicine: "audio",
      emergencyProcedures: "documented",
      countermeasureLevel: "analog",
    },
    crew: {
      roleStructure: "defined",
      priorAcquaintance: "partial",
      languageCulture: "mixed",
      trainingLevel: "standard",
    },
    eva: { type: "terrain-field", terrain: "volcanic", equipmentHazard: "moderate" },
    evidenceGrade: "development",
    citations: [],
  },
};

const crew: IMMCrewMember[] = [{
  id: "c1",
  sex: "male",
  contacts: false,
  crowns: false,
  CAC_positive: false,
  abdominal_surgery_history: false,
  EVA_eligible: true,
  EVA_count: 3,
}];

const excludedSpaceEvaConditions: IMMCondition[] = [{
  id: "decompression-sickness-eva",
  label: "Decompression sickness EVA",
  family: "traumatic",
  incidenceSource: "in-flight",
  incidenceDist: "Beta",
  processType: "EVA-coupled",
  riskFactors: ["EVA"],
  vulnerabilityCriteria: [],
}];

describe("analog field-exposure disclosure", () => {
  it("separates terrestrial field hazards from excluded space-EVA priors", () => {
    const disclosure = buildAnalogFieldExposureDisclosure({
      mission,
      crew,
      excludedSpaceEvaConditions,
    });

    expect(disclosure.status).toBe("not-modeled");
    expect(disclosure.evidenceStatus).toBe("unsupported");
    expect(disclosure.profileEvaType).toBe("terrain-field");
    expect(disclosure.crewEvaEventCount).toBe(3);
    expect(disclosure.spaceEvaPriorsReused).toBe(false);
    expect(disclosure.excludedSpaceEvaConditionIds).toEqual(["decompression-sickness-eva"]);
    expect(disclosure.omittedAnalogProcessFamilies).toEqual(ANALOG_FIELD_EXPOSURE_PROCESS_FAMILIES);
    expect(disclosure.requiredUpgrade).toContain("analog-specific exposure denominators");
  });
});
