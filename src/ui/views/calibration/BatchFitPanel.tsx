import { useEffect, useState } from "react";
import { ConditionCombobox } from "./ConditionCombobox";
import { type FitResult } from "@/api/calibration";
import { useCalibrationJobs } from "@/contexts/CalibrationJobsContext";
import evidenceStatus from "@/data/evidence-status.json";

function fmtDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

function classForRhat(r: number): string {
  return r < 1.01 ? "text-go" : "text-warn";
}

function classForDivs(d: number): string {
  return d === 0 ? "text-go" : "text-warn";
}

export function BatchFitPanel() {
  const [draws, setDraws] = useState(2000);
  const [chains, setChains] = useState(4);
  const [seed, setSeed] = useState(42);
  const [conditionId, setConditionId] = useState<string | null>(null);

  // Job state lives in the app-root CalibrationJobsProvider so it survives
  // leaving the Calibration tab (and a page refresh). See the provider.
  const { fit, startFitJob } = useCalibrationJobs();
  const running = fit.status === "queued" || fit.status === "running";
  const error = fit.error;

  // Live elapsed readout: tick every second while running; frozen once done.
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  const elapsed = fit.startedAt ? (fit.finishedAt ?? Date.now()) - fit.startedAt : 0;

  function handleStart() {
    void startFitJob({ draws, chains, seed, condition_id: conditionId });
  }

  const fittedEntries: [string, FitResult][] = fit.result?.fitted
    ? Object.entries(fit.result.fitted)
    : [];

  return (
    <div className="fadein space-y-6">
      {/* Config form */}
      <div className="panel p-6">
        <div className="flex items-baseline gap-x-3 mb-5">
          <h3 className="display text-xl text-ink-0 tracking-tight">Batch Fit</h3>
          <span className="label text-ink-3">PyMC NUTS · Gamma-Poisson</span>
        </div>

        {!evidenceStatus.releasePriorsAdjudicated && (
          <div className="border border-warn/40 bg-warn/5 px-3 py-2 mb-5">
            <p className="mono text-[12px] uppercase tracking-cap text-warn mb-1">
              Evidence ledger not release-ready
            </p>
            <p className="text-sm text-ink-2">
              Fitting uses accepted rows only and skips uncovered conditions unless they are run through proposal tooling outside this UI.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {[
            { label: "draws", value: draws, min: 100, max: 20000, onChange: setDraws },
            { label: "chains", value: chains, min: 1, max: 8, onChange: setChains },
            { label: "seed", value: seed, min: 0, max: 999999, onChange: setSeed },
          ].map((f) => (
            <div key={f.label} className="flex flex-col gap-1">
              <label className="label text-ink-3">{f.label}</label>
              <input
                type="number"
                min={f.min}
                max={f.max}
                value={f.value}
                onChange={(e) => f.onChange(Number(e.target.value))}
                className="mono text-[13px] bg-bg-1 border border-line text-ink-1 px-2 py-1.5 rounded-sm focus:outline-none focus:border-signal"
              />
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <label className="label text-ink-3">condition</label>
            <ConditionCombobox value={conditionId} onChange={setConditionId} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={running}
            onClick={handleStart}
            className={`mono uppercase tracking-cap text-[13px] px-4 py-2 border rounded-sm transition-colors ${
              running
                ? "border-line text-ink-3 cursor-not-allowed"
                : "border-signal text-signal hover:bg-signal/10"
            }`}
          >
            {running ? "Running…" : "▶ Run Fit"}
          </button>
          {running && (
            <span className="flex items-center gap-2">
              <span className="signal-dot" />
              <span className="mono text-[13px] text-ink-2">
                {fit.status} · {fmtDuration(elapsed)}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="panel p-6 border-warn/50">
          <p className="mono text-[13px] uppercase tracking-cap text-warn mb-1">API Error</p>
          <p className="mono text-[13px] text-ink-1">{error}</p>
        </div>
      )}

      {/* Job result */}
      {fit.status === "done" && (
        <div className="panel p-6 fadein">
          <div className="flex items-baseline gap-x-3 mb-4">
            <h4 className="display text-lg text-ink-0 tracking-tight">Results</h4>
            <span className="label text-go">
              {fit.result?.n_fitted} fitted · {fit.result?.n_failed} failed
            </span>
            <span className="mono text-[12px] text-ink-3 ml-auto">
              elapsed {fmtDuration(elapsed)}
            </span>
          </div>

          {fittedEntries.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line">
                    {[
                      "Condition",
                      "λ mean",
                      "α",
                      "β",
                      "R-hat",
                      "ESS",
                      "Divs",
                    ].map((h) => (
                      <th
                        key={h}
                        className="label px-3 py-2 text-ink-3 sticky top-0 bg-bg-1"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fittedEntries.map(([cid, r]) => (
                    <tr
                      key={cid}
                      className="border-b border-line/50 hover:bg-bg-2/50 transition-colors"
                    >
                      <td className="px-3 py-2">
                        <div className="mono text-[13px] text-ink-0">{cid}</div>
                      </td>
                      <td className="px-3 py-2 mono text-[13px] text-ink-1">
                        {r.posterior_lambda_mean.toExponential(3)}
                      </td>
                      <td className="px-3 py-2 mono text-[13px] text-ink-1">
                        {r.posterior_alpha.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 mono text-[13px] text-ink-1">
                        {r.posterior_beta.toFixed(2)}
                      </td>
                      <td className={`px-3 py-2 mono text-[13px] ${classForRhat(r.r_hat)}`}>
                        {r.r_hat.toFixed(4)}
                      </td>
                      <td className="px-3 py-2 mono text-[13px] text-ink-1">
                        {Math.round(r.ess_bulk)}
                      </td>
                      <td className={`px-3 py-2 mono text-[13px] ${classForDivs(r.divergences)}`}>
                        {r.divergences}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {fit.status === "failed" && (
        <div className="panel p-6 border-warn/50 fadein">
          <p className="mono text-[13px] uppercase tracking-cap text-warn mb-1">Job Failed</p>
          <p className="mono text-[13px] text-ink-1">{fit.error ?? "Unknown error"}</p>
        </div>
      )}
    </div>
  );
}
