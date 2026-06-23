// src/ui/views/Analysis.tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Candidate, Criterion } from "@/types";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import { listCandidates, listCriterionEntries } from "@/db/repository";
import { makeDemoCohort } from "@/analysis/demo-cohort";
import { buildBubbleData } from "@/analysis/imm-bubbles";
import { couplingMatrix } from "@/analysis/coupling";
import { IMM_CONDITIONS } from "@/imm/conditions";
import { loadIMMPriors } from "@/imm/priors";
import { FAMILY_BETA, FAMILY_BETA_DEFAULT } from "@/imm/simulate";
import { CriteriaHeatmap } from "@/ui/figures/CriteriaHeatmap";
import { RiskBubbleScatter } from "@/ui/figures/RiskBubbleScatter";
import { CriteriaSplom } from "@/ui/figures/CriteriaSplom";
import { CriterionCorrelationHeatmap } from "@/ui/figures/CriterionCorrelationHeatmap";
import { VulnerabilityCouplingHeatmap } from "@/ui/figures/VulnerabilityCouplingHeatmap";

const MIN_COHORT = 8;
const MISSION_DAYS = 180;

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel p-5">
      <h2 className="label mb-3">{title}</h2>
      {children}
    </section>
  );
}

function CouplingAuditTable({ criteria }: { criteria: readonly Criterion[] }) {
  const rows = useMemo(() => {
    const { families, matrix } = couplingMatrix(criteria, IMM_CONDITIONS, FAMILY_BETA, FAMILY_BETA_DEFAULT);
    return criteria
      .map((criterion, i) => {
        const conditionCount = IMM_CONDITIONS.filter((condition) =>
          condition.vulnerabilityCriteria.includes(criterion.id),
        ).length;
        const activeFamilies = families.filter((_, j) => matrix[i][j] > 0);
        const betaAbsSum = matrix[i].reduce((sum, v) => sum + v, 0);
        return {
          id: criterion.id,
          label: criterion.label,
          families: activeFamilies.join(", "),
          familyCount: activeFamilies.length,
          conditionCount,
          betaAbsSum,
        };
      })
      .filter((row) => row.conditionCount > 0)
      .sort((a, b) => b.betaAbsSum - a.betaAbsSum || b.conditionCount - a.conditionCount);
  }, [criteria]);

  if (rows.length === 0) return null;

  return (
    <div className="mt-5 overflow-x-auto border-t border-line pt-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
        <h3 className="label text-ink-1 uppercase tracking-cap">Coupling audit</h3>
        <span className="mono text-[12px] text-ink-3">
          β values are operator-supplied scenario defaults; scientific mode leaves these multipliers off.
        </span>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-line">
            {["Criterion", "Families", "Conditions", "Σ|β|"].map((h) => (
              <th key={h} className="label px-3 py-2 text-ink-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-line/50">
              <td className="px-3 py-2">
                <div className="mono text-[13px] text-ink-0">{row.label}</div>
                <div className="mono text-[11px] text-ink-3">{row.id}</div>
              </td>
              <td className="px-3 py-2 mono text-[12px] text-ink-2 max-w-[360px]">{row.families}</td>
              <td className="px-3 py-2 mono text-[13px] text-ink-1">
                {row.conditionCount} across {row.familyCount}
              </td>
              <td className="px-3 py-2 mono text-[13px] text-ink-1">{row.betaAbsSum.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Analysis() {
  const criteria = PLACEHOLDER_CRITERIA;
  const [cohort, setCohort] = useState<Candidate[]>(() => makeDemoCohort(criteria));
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const rows = await listCandidates();
      const assembled: Candidate[] = [];
      for (const r of rows) {
        const entries = await listCriterionEntries(r.id);
        if (entries.length === 0) continue;
        const scores: Record<string, number> = {};
        for (const e of entries) scores[e.criterionId] = e.rawValue;
        assembled.push({ id: r.id, alias: r.alias, scores });
      }
      const wellScored = assembled.filter(
        (c) => criteria.filter((cr) => c.scores[cr.id] != null).length >= Math.ceil(criteria.length * 0.6),
      );
      if (!alive) return;
      if (wellScored.length >= MIN_COHORT) { setCohort(wellScored); setIsDemo(false); }
      else { setCohort(makeDemoCohort(criteria)); setIsDemo(true); }
    })();
    return () => { alive = false; };
  }, [criteria]);

  const { points, excluded } = useMemo(
    () => buildBubbleData(IMM_CONDITIONS, loadIMMPriors().conditions, MISSION_DAYS),
    [],
  );

  return (
    <div className="fadein space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="display text-xl text-ink-0">Correlation analysis</h1>
        <span className="mono text-[12px] uppercase tracking-cap text-ink-3">
          {isDemo ? `demo cohort · N=${cohort.length}` : `live pool · N=${cohort.length}`}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <Panel title="A1 · Candidate profiles (sorted matrix)">
          <CriteriaHeatmap cohort={cohort} criteria={criteria} isDemo={isDemo} />
        </Panel>
        <Panel title="A2 · IMM risk landscape (multi-dimensional)">
          <RiskBubbleScatter points={points} excluded={excluded.length} missionDays={MISSION_DAYS} />
        </Panel>
        <Panel title="A3 · Criteria scatterplot matrix">
          <CriteriaSplom cohort={cohort} criteria={criteria} isDemo={isDemo} />
        </Panel>
        <Panel title="A4 · Criterion correlation">
          <CriterionCorrelationHeatmap cohort={cohort} criteria={criteria} isDemo={isDemo} />
        </Panel>
        <Panel title="A5 · Vulnerability coupling">
          <VulnerabilityCouplingHeatmap criteria={criteria} />
          <CouplingAuditTable criteria={criteria} />
        </Panel>
      </div>
    </div>
  );
}
