// tests/analysis/coupling.test.ts
import { describe, it, expect } from "vitest";
import { couplingMatrix } from "@/analysis/coupling";
import type { IMMCondition, IMMConditionFamily } from "@/imm/types";
import type { Criterion } from "@/types";

const crit = (id: string): Criterion => ({
  id, family: "psychological", label: id, description: "", instrument: "",
  scale: { min: 0, max: 100 }, higherIsBetter: true, citations: [], minimumTier: "minimum",
} as unknown as Criterion);

const cond = (id: string, family: IMMConditionFamily, vc: string[]): IMMCondition => ({
  id, label: id, family, incidenceSource: "in-flight", incidenceDist: "Gamma",
  processType: "general-Poisson", riskFactors: [], vulnerabilityCriteria: vc,
} as unknown as IMMCondition);

describe("couplingMatrix", () => {
  it("accumulates |β| per (criterion, family) over coupled conditions", () => {
    const criteria = [crit("c0"), crit("c1")];
    const conditions = [
      cond("p1", "psychiatric", ["c0"]),
      cond("r1", "renal", ["c0", "c1"]),
      cond("u1", "GI", []), // uncoupled → contributes nothing
    ];
    const beta = { psychiatric: -0.4, renal: -0.15 };
    const { families, matrix } = couplingMatrix(criteria, conditions, beta, -0.2);
    const jPsy = families.indexOf("psychiatric");
    const jRen = families.indexOf("renal");
    expect(matrix[0][jPsy]).toBeCloseTo(0.4, 12); // c0 ← psychiatric
    expect(matrix[0][jRen]).toBeCloseTo(0.15, 12); // c0 ← renal
    expect(matrix[1][jPsy]).toBe(0); // c1 not coupled to psychiatric
    expect(matrix[1][jRen]).toBeCloseTo(0.15, 12); // c1 ← renal
  });
  it("uses the default β for families absent from the map", () => {
    const { families, matrix } = couplingMatrix([crit("c0")], [cond("g1", "GI", ["c0"])], {}, -0.2);
    expect(matrix[0][families.indexOf("GI")]).toBeCloseTo(0.2, 12);
  });
});
