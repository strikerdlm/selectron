// src/ui/views/Analysis.tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Candidate } from "@/types";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import { listCandidates, listCriterionEntries } from "@/db/repository";
import { makeDemoCohort } from "@/analysis/demo-cohort";
import { buildBubbleData } from "@/analysis/imm-bubbles";
import { IMM_CONDITIONS } from "@/imm/conditions";
import { loadIMMPriors } from "@/imm/priors";
import { ParallelCriteria } from "@/ui/figures/ParallelCriteria";
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
        <Panel title="A1 · Candidate profiles (parallel coordinates)">
          <ParallelCriteria cohort={cohort} criteria={criteria} isDemo={isDemo} />
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
        </Panel>
      </div>
    </div>
  );
}
