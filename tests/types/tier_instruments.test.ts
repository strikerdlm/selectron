import { describe, expect, test } from "vitest";
import type { Criterion, CriterionInstrument } from "@/types";
import { ACCESS_TIERS } from "@/types";

describe("Criterion.tierInstruments", () => {
  test("type accepts a Record<AccessTier, CriterionInstrument> on the optional field", () => {
    const c: Criterion = {
      id: "test.demo",
      family: "psychological",
      label: "Demo",
      description: "Demo construct for the type-level test.",
      instrument: "Demo (legacy default)",
      scale: { min: 0, max: 1 },
      higherIsBetter: true,
      citations: ["10.0000/demo"],
      tierInstruments: {
        minimum: {
          instrument: "Free demo (Tier 1)",
          citations: ["10.0000/free"],
          scaleTransform: { multiplier: 2, note: "raw × 2 → canonical scale" },
        },
        medium: {
          instrument: "Mid-tier demo",
          citations: ["10.0000/mid"],
        },
        elite: {
          instrument: "Elite demo",
          citations: ["10.0000/elite"],
          notes: "specialist required",
        },
      },
    };
    expect(c.tierInstruments).toBeDefined();
    for (const t of ACCESS_TIERS) {
      const inst: CriterionInstrument | undefined = c.tierInstruments?.[t];
      expect(inst).toBeDefined();
      expect(typeof inst!.instrument).toBe("string");
      expect(Array.isArray(inst!.citations)).toBe(true);
    }
  });
});
