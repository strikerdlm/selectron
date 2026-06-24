// src/ui/figures/PaperF7IMM.tsx
//
// IMM Calculator multi-mission comparison — paper Figure 7 (v0.5.1+).
//
// Replaces the Iter-3 synthetic-multi-mission PaperF7 (which used the
// usePaperF7Seed-generated synthetic chi samples) with the IMM Calculator
// applied across 7 representative Earth-analog + LEO-ISS missions at the
// operational ISS HMS kit. Each mission row shows CHI mean (with a 95%
// simulation interval), health-criterion %, and an experimental LxC color chip.
//
// Source data: src/data/imm-worked-example.json (computed offline by
// scripts/extract_imm_worked_example.ts at T = 25 000 trials × 7 missions).
// Caption text: paper/manuscript.md §3.5 (post-v0.5.1 revision)

import workedExample from "@/data/imm-worked-example.json";

type F7Row = (typeof workedExample.f7.rows)[number];

function lxcColorForRow(row: F7Row): "green" | "yellow" | "red" {
  // Same bucketing rules as src/imm/lxc.ts. fractionLost = 1 − CHI/100,
  // pFailure = 1 − health criterion/100. Computed inline so this fixture has no runtime
  // dependency on simulateIMM / assessIMMLxC (Playwright e2e load speed).
  const fractionLost = Math.max(0, 1 - row.chi_mean / 100);
  const pFailure = Math.max(0, 1 - row.missionSuccess_mean / 100);
  // bucketConsequence
  const C = fractionLost <= 0.01 ? 1 : fractionLost <= 0.05 ? 2 : fractionLost <= 0.15 ? 3 : fractionLost <= 0.30 ? 4 : 5;
  // bucketLikelihood (JSC-66705 In-Mission bands: ≤0.0001, ≤0.001, ≤0.01, ≤0.10, >0.10)
  const L = pFailure <= 0.0001 ? 1 : pFailure <= 0.001 ? 2 : pFailure <= 0.01 ? 3 : pFailure <= 0.10 ? 4 : 5;
  // priority-score lookup from JSC-66705 Figure 4
  const PRIORITY = [
    [1, 3, 5, 8, 12],
    [2, 6, 11, 14, 17],
    [4, 9, 15, 19, 21],
    [7, 13, 18, 22, 24],
    [10, 16, 20, 23, 25],
  ];
  const score = PRIORITY[L - 1][C - 1];
  return score >= 20 ? "red" : score >= 11 ? "yellow" : "green";
}

const chipClass = (color: "green" | "yellow" | "red") =>
  color === "red" ? "bg-red-200 text-red-900 border-red-400"
  : color === "yellow" ? "bg-amber-200 text-amber-900 border-amber-400"
  : "bg-emerald-200 text-emerald-900 border-emerald-400";

export function PaperF7IMM() {
  const f7 = workedExample.f7;
  // Sort by duration ascending for the comparison panel.
  const rows = [...f7.rows].sort((a, b) => a.durationDays - b.durationDays);

  // Find max chi width for visual bar normalization (100 is the obvious cap).
  return (
    <div className="p-8 bg-white" style={{ width: 1400 }}>
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold text-gray-900">
          IMM Calculator multi-mission comparison — operational ISS HMS kit
        </h1>
        <p className="mono text-[14px] text-gray-600 mt-2">
          {f7.rows.length} missions · T = {f7.trials.toLocaleString()} trials per mission · seed = 0x{(workedExample.seed).toString(16)} · kit = {f7.kit.label}
        </p>
        <p className="mono text-[12px] text-gray-500 mt-1">
          {f7.crew_label}
        </p>
      </div>

      {/* Mission comparison table */}
      <table className="mono text-[14px] w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100 text-gray-800">
            <th className="text-left p-2">Mission</th>
            <th className="text-right p-2">Duration (d)</th>
            <th className="text-right p-2">Crew</th>
            <th className="text-right p-2">CHI</th>
            <th className="text-right p-2">CHI simulation interval₉₅</th>
            <th className="text-right p-2">pEVAC %</th>
            <th className="text-right p-2">pLOCL %</th>
            <th className="text-right p-2">Health criterion %</th>
            <th className="text-center p-2">Appendix LxC</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const color = lxcColorForRow(row);
            return (
              <tr key={row.missionId} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="p-2">
                  <div className="font-semibold text-gray-900">{row.missionId}</div>
                  <div className="text-[11px] text-gray-500">{row.missionLabel}</div>
                </td>
                <td className="p-2 text-right text-gray-800">{row.durationDays}</td>
                <td className="p-2 text-right text-gray-800">{row.crewSize}</td>
                <td className="p-2 text-right font-semibold text-gray-900">{row.chi_mean.toFixed(2)}</td>
                <td className="p-2 text-right text-gray-600">
                  [{row.chi_ci95[0].toFixed(1)}, {row.chi_ci95[1].toFixed(1)}]
                </td>
                <td className="p-2 text-right text-gray-800">{row.pEvac_mean.toFixed(2)}</td>
                <td className="p-2 text-right text-gray-800">{row.pLocl_mean.toFixed(2)}</td>
                <td className="p-2 text-right text-gray-800">{row.missionSuccess_mean.toFixed(1)}</td>
                <td className="p-2 text-center">
                  <span className={`inline-block border ${chipClass(color)} text-[12px] uppercase font-bold tracking-wide px-2 py-0.5 rounded`}>
                    {color}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Visual: CHI horizontal bars sorted by duration */}
      <div className="mt-8 max-w-5xl">
        <h3 className="text-[14px] font-semibold text-gray-700 mb-3">Crew Health Index ($\chi$) per mission, sorted by duration:</h3>
        <div className="space-y-1.5">
          {rows.map((row) => {
            const widthPct = row.chi_mean; // CHI is already in 0–100 range
            const color = lxcColorForRow(row);
            const barColor = color === "red" ? "bg-red-400"
                           : color === "yellow" ? "bg-amber-400"
                           : "bg-emerald-400";
            return (
              <div key={row.missionId} className="flex items-center gap-2 mono text-[12px]">
                <div className="w-44 truncate text-gray-700">{row.missionId}</div>
                <div className="w-12 text-right text-gray-600">{row.durationDays}d</div>
                <div className="flex-1 bg-gray-100 rounded relative h-6">
                  <div
                    className={`${barColor} h-full rounded transition-all`}
                    style={{ width: `${widthPct}%` }}
                  />
                  <span className="absolute top-1 right-2 text-gray-900 font-semibold">
                    χ = {row.chi_mean.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mono text-[10px] text-gray-500 mt-6 max-w-5xl">
        Note: this is an inter-model agreement comparison across analog +
        LEO-ISS missions using the IMM Calculator's per-condition prior set;
        it is NOT a validation against in-flight observed analog-mission
        outcomes (which would require LSAH or analog-program incident
        registries unavailable at the paper horizon). Mission CHI decreases
        monotonically with duration, consistent with the expectation that
        longer missions accumulate more medical events; the K15 reference
        crew is used uniformly across all missions to control for crew
        composition as a confounder.
      </p>
    </div>
  );
}
