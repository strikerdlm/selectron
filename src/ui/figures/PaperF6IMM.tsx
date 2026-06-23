// src/ui/figures/PaperF6IMM.tsx
//
// IMM Calculator experimental LxC appendix mapping — paper Figure 6 (v0.5.1+).
//
// Replaces the Iter-3 src/risk/-backed PaperF6 LxC render with an IMM-Calculator
// equivalent: K15 reference crew × ISS 6mo × ISS HMS at T = 100,000 trials,
// seed 0xc0ffee, computed offline by scripts/extract_imm_worked_example.ts and
// loaded as a static JSON import for synchronous Playwright snapshot.
//
// The L4 × C3 = 18 yellow mapping at the v0.5.0 calibration is a historical
// appendix comparison only: significant fraction-lost (CHI 90.25 → 9.75 %
// fractionLost = C3) at a measurable threshold-failure probability
// (1 − health criterion 92.1 % = 7.9 % = L4 in the configured bands).
//
// Source data: src/data/imm-worked-example.json
// Caption text: paper/manuscript.md §3.4 (post-v0.5.1 revision)

import workedExample from "@/data/imm-worked-example.json";
import { LXC_PRIORITY_SCORES } from "@/risk/lxc-definitions";

export function PaperF6IMM() {
  const f6 = workedExample.f6;
  const L = f6.assessment.likelihood;
  const C = f6.assessment.consequence;
  const color = f6.assessment.color as "green" | "yellow" | "red";

  const colorClass = color === "red" ? "bg-red-500/15 text-red-700 border-red-500"
                   : color === "yellow" ? "bg-amber-400/20 text-amber-900 border-amber-500"
                   : "bg-emerald-500/15 text-emerald-700 border-emerald-500";

  return (
    <div className="p-8 bg-white" style={{ width: 1400 }}>
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold text-gray-900">
          Experimental Likelihood × Consequence appendix — IMM Calculator at v0.5.x
        </h1>
        <p className="mono text-[14px] text-gray-600 mt-2">
          {f6.mission.label} · kit = {f6.kit.label} · T = {f6.trials.toLocaleString()} trials · seed = 0x{(workedExample.seed).toString(16)}
        </p>
        <p className="mono text-[12px] text-gray-500 mt-1">{f6.crew_label}</p>
      </div>

      {/* 5×5 LxC grid */}
      <div className="grid grid-cols-6 gap-1 max-w-4xl">
        {/* Header row: empty + C1..C5 */}
        <div></div>
        {[1, 2, 3, 4, 5].map((c) => (
          <div key={`hC${c}`} className="text-center font-semibold text-gray-700 py-2">C{c}</div>
        ))}
        {/* L5 (top) → L1 (bottom) per JSC-66705 Figure 4 layout */}
        {[5, 4, 3, 2, 1].map((Lrow) => (
          <>
            <div key={`hL${Lrow}`} className="font-semibold text-gray-700 py-2 flex items-center justify-center">
              L{Lrow}
            </div>
            {[1, 2, 3, 4, 5].map((Ccol) => {
              const score = LXC_PRIORITY_SCORES[Lrow - 1][Ccol - 1];
              const isHighlight = Lrow === L && Ccol === C;
              const cellColor = score >= 20 ? "bg-red-200" : score >= 11 ? "bg-amber-200" : "bg-emerald-200";
              const ring = isHighlight ? "ring-4 ring-blue-600 ring-offset-2 font-bold scale-105" : "";
              return (
                <div
                  key={`L${Lrow}C${Ccol}`}
                  className={`${cellColor} ${ring} flex items-center justify-center h-16 text-[18px] text-gray-900 transition-all`}
                >
                  {score}
                </div>
              );
            })}
          </>
        ))}
      </div>

      {/* Appendix mapping callout */}
      <div className={`mt-6 border-2 ${colorClass} rounded p-5 max-w-4xl`}>
        <div className="flex items-baseline gap-4 flex-wrap">
          <span className="text-4xl font-bold">L{L} × C{C} = {f6.assessment.score}</span>
          <span className="mono text-[14px] uppercase tracking-wide">{color}</span>
        </div>
        <dl className="mono text-[12px] mt-3 grid grid-cols-2 gap-x-6 gap-y-1">
          <dt className="text-gray-700">Likelihood</dt>
          <dd>L{L} · {f6.assessment.likelihoodLabel} · threshold failure = {(100 * f6.assessment.pMissionFailure).toFixed(2)}%</dd>
          <dt className="text-gray-700">Consequence</dt>
          <dd>C{C} · {f6.assessment.consequenceLabel} · fractionLost = {(100 * f6.assessment.fractionLost).toFixed(2)}%</dd>
        </dl>
        <p className="mono text-[10px] text-gray-600 mt-3 border-t border-current/30 pt-2">
          threshold failure = 1 − health criterion (health criterion = P[no EVAC ∧ no LOCL ∧ CHI ≥ χ*=0.7]).
          fractionLost = 1 − CHI/100. Non-operational appendix mapping.
        </p>
      </div>

      {/* IMM outputs vs K15 reference */}
      <div className="mt-6 max-w-4xl">
        <h3 className="text-[14px] font-semibold text-gray-700 mb-2">IMM Calculator outputs vs K15 Table 1 reference (issHMS scenario):</h3>
        <table className="mono text-[12px] w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2">Metric</th>
              <th className="text-right p-2">IMM Calculator</th>
              <th className="text-right p-2">K15 reference</th>
              <th className="text-right p-2">Δ</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: "TME (events)", ours: f6.outcome.tme_mean, ref: f6.k15_reference.tme_mean, fmt: (x: number) => x.toFixed(2) },
              { label: "CHI (%)", ours: f6.outcome.chi_mean, ref: f6.k15_reference.chi_mean, fmt: (x: number) => x.toFixed(2) },
              { label: "pEVAC (%)", ours: f6.outcome.pEvac_mean, ref: f6.k15_reference.pEvac_mean, fmt: (x: number) => x.toFixed(2) },
              { label: "pLOCL (%)", ours: f6.outcome.pLocl_mean, ref: f6.k15_reference.pLocl_mean, fmt: (x: number) => x.toFixed(2) },
            ].map((row) => {
              const delta = row.ours - row.ref;
              const sign = delta >= 0 ? "+" : "";
              return (
                <tr key={row.label} className="border-t border-gray-200">
                  <td className="p-2">{row.label}</td>
                  <td className="p-2 text-right">{row.fmt(row.ours)}</td>
                  <td className="p-2 text-right text-gray-500">{row.fmt(row.ref)}</td>
                  <td className="p-2 text-right">{sign}{row.fmt(delta)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
