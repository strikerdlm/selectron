// src/analysis/coupling.ts
// Criterion × condition-family vulnerability-coupling matrix.
// Cell = Σ over conditions in that family coupled to that criterion of |family β|.
import type { IMMCondition, IMMConditionFamily } from "@/imm/types";
import type { Criterion } from "@/types";

export function couplingMatrix(
  criteria: readonly Criterion[],
  conditions: readonly IMMCondition[],
  familyBeta: Partial<Record<IMMConditionFamily, number>>,
  defaultBeta: number,
): { families: IMMConditionFamily[]; matrix: number[][] } {
  const families = [...new Set(conditions.map((c) => c.family))].sort() as IMMConditionFamily[];
  const colIndex = new Map(families.map((f, j) => [f, j] as const));
  const rowIndex = new Map(criteria.map((c, i) => [c.id, i] as const));
  const matrix = criteria.map(() => new Array<number>(families.length).fill(0));
  for (const cond of conditions) {
    if (cond.vulnerabilityCriteria.length === 0) continue;
    const j = colIndex.get(cond.family);
    if (j == null) continue;
    const beta = Math.abs(familyBeta[cond.family] ?? defaultBeta);
    for (const cid of cond.vulnerabilityCriteria) {
      const i = rowIndex.get(cid);
      if (i == null) continue;
      matrix[i][j] += beta;
    }
  }
  return { families, matrix };
}
