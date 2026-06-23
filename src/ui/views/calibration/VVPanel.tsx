import { useEffect, useState } from "react";
import { type MetricResult } from "@/api/calibration";
import { useCalibrationJobs } from "@/contexts/CalibrationJobsContext";
import evidenceStatus from "@/data/evidence-status.json";
import { SensitivityTornado } from "@/ui/figures/SensitivityTornado";

const TRIAL_OPTIONS = [1_000, 5_000, 10_000, 50_000, 100_000];
const DEFAULT_SEED = 0xc0ffee;
const TOP_N_OPTIONS = [5, 10, 15, 20, 30];
const SCENARIO_ORDER = ["none", "issHMS", "unlimited"];

function fmtDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

function StatusBadge({ metric }: { metric: MetricResult }) {
  const pass = metric.within_accepted ?? metric.within_ci95;
  const label = metric.k15_status === "within-k15-ci95" ? "K15 CI95" : "accepted";
  return pass ? (
    <span
      className="mono text-[12px] uppercase tracking-cap text-go"
      title={metric.tracking || "Observed value is inside the accepted regression bracket."}
    >
      {label}
    </span>
  ) : (
    <span
      className="mono text-[12px] uppercase tracking-cap text-warn"
      title={metric.tracking || "Observed value is outside the accepted regression bracket."}
    >
      outside
    </span>
  );
}

function SummaryBadge({ label, n, total }: { label: string; n: number; total: number }) {
  const color = n === total ? "text-go" : n >= Math.ceil(total / 2) ? "text-signal" : "text-warn";
  return (
    <span className={`label ${color}`}>
      {n}/{total} {label}
    </span>
  );
}

function fmtInt(n: number): string {
  return n.toLocaleString();
}

function EvidenceStatusSection() {
  const releaseReady = evidenceStatus.releasePriorsAdjudicated;
  const coveragePct = evidenceStatus.activeParameterCount > 0
    ? (evidenceStatus.acceptedCoveredParameterCount / evidenceStatus.activeParameterCount) * 100
    : 0;
  const stats = [
    { label: "accepted rows", value: fmtInt(evidenceStatus.acceptedCount) },
    { label: "proposal refs", value: fmtInt(evidenceStatus.proposalRefCount) },
    { label: "covered params", value: `${fmtInt(evidenceStatus.acceptedCoveredParameterCount)} / ${fmtInt(evidenceStatus.activeParameterCount)}` },
    { label: "coverage", value: `${coveragePct.toFixed(1)}%` },
  ];

  return (
    <section className={`panel p-5 ${releaseReady ? "border-go/40" : "border-warn/40 bg-warn/5"}`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <h3 className="display text-xl text-ink-0 tracking-tight">Evidence Ledger Status</h3>
        <span className={`mono text-[12px] uppercase tracking-cap ${releaseReady ? "text-go" : "text-warn"}`}>
          {evidenceStatus.status}
        </span>
        <span className="mono text-[12px] text-ink-3 ml-auto">
          {new Date(evidenceStatus.generatedAt).toLocaleString()}
        </span>
      </div>
      <p className="text-sm text-ink-2 mt-3 max-w-4xl">
        {evidenceStatus.message}
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 border-y border-line/60 divide-x divide-line/60 mt-4">
        {stats.map((s) => (
          <div key={s.label} className="px-3 py-3">
            <div className="mono text-[12px] text-ink-0">{s.value}</div>
            <div className="label text-[11px] text-ink-3 uppercase tracking-cap mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      {evidenceStatus.proposalRefConditionIds.length > 0 && (
        <p className="mono text-[12px] text-ink-3 mt-3">
          proposal-only conditions: {evidenceStatus.proposalRefConditionIds.join(", ")}
        </p>
      )}
    </section>
  );
}

function ValidationSection() {
  const [trials, setTrials] = useState(10_000);
  const [seed, setSeed] = useState(DEFAULT_SEED);

  // Persisted across tab switches + refresh via the app-root provider.
  const { validation, startValidationJob } = useCalibrationJobs();
  const running = validation.status === "queued" || validation.status === "running";
  const error = validation.error;
  const result = validation.result;

  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  const elapsed = validation.startedAt ? (validation.finishedAt ?? Date.now()) - validation.startedAt : 0;

  function handleRun() {
    void startValidationJob({ trials, seed });
  }

  const groupedMetrics: Record<string, MetricResult[]> = {};
  if (result) {
    for (const m of result.metrics) {
      (groupedMetrics[m.scenario] ??= []).push(m);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-x-3">
        <h3 className="display text-xl text-ink-0 tracking-tight">K15 Validation Gate</h3>
        <span className="label text-ink-3">3 scenarios × 4 metrics</span>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="label text-ink-3">trials</label>
          <div className="flex gap-1">
            {TRIAL_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTrials(t)}
                className={`mono text-[12px] px-2 py-1 border rounded-sm transition-colors ${
                  trials === t
                    ? "border-signal text-signal bg-signal/10"
                    : "border-line text-ink-2 hover:text-ink-0"
                }`}
              >
                {t >= 1000 ? `${t / 1000}k` : t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="label text-ink-3">seed</label>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value))}
            className="mono text-[13px] bg-bg-1 border border-line text-ink-1 px-2 py-1.5 rounded-sm focus:outline-none focus:border-signal w-28"
          />
        </div>
        <button
          type="button"
          disabled={running}
          onClick={handleRun}
          className={`mono uppercase tracking-cap text-[13px] px-4 py-2 border rounded-sm transition-colors ${
            running
              ? "border-line text-ink-3 cursor-not-allowed"
              : "border-signal text-signal hover:bg-signal/10"
          }`}
        >
          {running ? "Running…" : "▶ Run Validation"}
        </button>
        {running && (
          <span className="flex items-center gap-2">
            <span className="signal-dot" />
            <span className="mono text-[13px] text-ink-2">{fmtDuration(elapsed)}</span>
          </span>
        )}
      </div>

      {error && (
        <div className="panel p-4 border-warn/50">
          <p className="mono text-[13px] text-warn">{error}</p>
        </div>
      )}

      {result && (
        <div className="panel p-6 fadein space-y-4">
          <div className="flex items-baseline gap-x-3">
            <h4 className="display text-lg text-ink-0 tracking-tight">Results</h4>
            <SummaryBadge
              label="accepted brackets"
              n={result.metrics.filter((m) => m.within_accepted ?? m.within_ci95).length}
              total={result.n_total}
            />
            <SummaryBadge label="within K15 CI₉₅" n={result.n_within_ci95} total={result.n_total} />
            <span className="mono text-[12px] text-ink-3 ml-auto">
              T={result.trials.toLocaleString()} · {fmtDuration(elapsed)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line">
                  {["Metric", "Observed", "K15 Ref", "K15 CI₉₅", "Accepted", "Δ", "Status"].map((h) => (
                    <th key={h} className="label px-3 py-2 text-ink-3 sticky top-0 bg-bg-1">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCENARIO_ORDER.map((scenario) => {
                  const metrics = groupedMetrics[scenario];
                  if (!metrics) return null;
                  return [
                    <tr key={`h-${scenario}`} className="border-b border-line bg-bg-2/30">
                      <td colSpan={7} className="px-3 py-1.5 mono text-[12px] uppercase tracking-cap text-ink-2">
                        {scenario}
                      </td>
                    </tr>,
                    ...metrics.map((m) => {
                      const acceptedLow = m.accepted_low ?? m.ci95_low;
                      const acceptedHigh = m.accepted_high ?? m.ci95_high;
                      return (
                        <tr key={`${scenario}-${m.metric}`} className="border-b border-line/50 hover:bg-bg-2/50 transition-colors">
                          <td className="px-3 py-2 mono text-[13px] text-ink-0">{m.metric}</td>
                          <td className="px-3 py-2 mono text-[13px] text-ink-1">{m.observed.toFixed(2)}</td>
                          <td className="px-3 py-2 mono text-[13px] text-ink-1">{m.reference.toFixed(2)}</td>
                          <td className="px-3 py-2 mono text-[13px] text-ink-2">
                            [{m.ci95_low.toFixed(2)}, {m.ci95_high.toFixed(2)}]
                          </td>
                          <td className="px-3 py-2 mono text-[13px] text-ink-2">
                            [{acceptedLow.toFixed(2)}, {acceptedHigh.toFixed(2)}]
                          </td>
                          <td className="px-3 py-2 mono text-[13px] text-ink-1">{m.delta >= 0 ? "+" : ""}{m.delta.toFixed(2)}</td>
                          <td className="px-3 py-2"><StatusBadge metric={m} /></td>
                        </tr>
                      );
                    }),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SensitivitySection() {
  const [method, setMethod] = useState<"sobol" | "morris">("morris");
  const [nSamples, setNSamples] = useState(10);
  const [trialsPerEval, setTrialsPerEval] = useState(1000);
  const [topN, setTopN] = useState(15);
  const [seed, setSeed] = useState(42);

  // Persisted across tab switches + refresh via the app-root provider.
  const { sensitivity, startSensitivityJob } = useCalibrationJobs();
  const running = sensitivity.status === "queued" || sensitivity.status === "running";
  const error = sensitivity.error;
  const result = sensitivity.result;
  // Render results by the method that PRODUCED them (the persisted result may
  // differ from the current form selection), not the live `method` input.
  const resultMethod: "sobol" | "morris" = result?.method === "sobol" ? "sobol" : "morris";

  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  const elapsed = sensitivity.startedAt ? (sensitivity.finishedAt ?? Date.now()) - sensitivity.startedAt : 0;

  function handleRun() {
    void startSensitivityJob({
      method,
      n_samples: nSamples,
      trials: trialsPerEval,
      seed,
      top_n: topN,
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-x-3">
        <h3 className="display text-xl text-ink-0 tracking-tight">Sensitivity Analysis</h3>
        <span className="label text-ink-3">Sobol / Morris</span>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="label text-ink-3">method</label>
          <div className="flex gap-1">
            {(["morris", "sobol"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMethod(m);
                  setNSamples(m === "morris" ? 10 : 64);
                }}
                className={`mono text-[12px] px-2 py-1 border rounded-sm transition-colors ${
                  method === m
                    ? "border-signal text-signal bg-signal/10"
                    : "border-line text-ink-2 hover:text-ink-0"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        {[
          { label: method === "morris" ? "trajectories" : "N samples", value: nSamples, onChange: setNSamples, min: 2, max: 2048 },
          { label: "trials/eval", value: trialsPerEval, onChange: setTrialsPerEval, min: 100, max: 100_000 },
          { label: "seed", value: seed, onChange: setSeed, min: 0, max: 999999 },
        ].map((f) => (
          <div key={f.label} className="flex flex-col gap-1">
            <label className="label text-ink-3">{f.label}</label>
            <input
              type="number"
              min={f.min}
              max={f.max}
              value={f.value}
              onChange={(e) => f.onChange(Number(e.target.value))}
              className="mono text-[13px] bg-bg-1 border border-line text-ink-1 px-2 py-1.5 rounded-sm focus:outline-none focus:border-signal w-24"
            />
          </div>
        ))}
        <div className="flex flex-col gap-1">
          <label className="label text-ink-3">top N</label>
          <select
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            className="mono text-[13px] bg-bg-1 border border-line text-ink-1 px-2 py-1.5 rounded-sm focus:outline-none focus:border-signal cursor-pointer"
          >
            {TOP_N_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          disabled={running}
          onClick={handleRun}
          className={`mono uppercase tracking-cap text-[13px] px-4 py-2 border rounded-sm transition-colors ${
            running
              ? "border-line text-ink-3 cursor-not-allowed"
              : "border-signal text-signal hover:bg-signal/10"
          }`}
        >
          {running ? "Running…" : "▶ Run Analysis"}
        </button>
        {running && (
          <span className="flex items-center gap-2">
            <span className="signal-dot" />
            <span className="mono text-[13px] text-ink-2">{fmtDuration(elapsed)}</span>
          </span>
        )}
      </div>

      {error && (
        <div className="panel p-4 border-warn/50">
          <p className="mono text-[13px] text-warn">{error}</p>
        </div>
      )}

      {result && (
        <div className="panel p-6 fadein space-y-4">
          <div className="flex items-baseline gap-x-3">
            <h4 className="display text-lg text-ink-0 tracking-tight">
              {result.method === "sobol" ? "Sobol" : "Morris"} — Top {result.indices.length}
            </h4>
            <span className="label text-ink-3">
              {result.n_evaluations.toLocaleString()} evaluations · {fmtDuration(elapsed)}
            </span>
          </div>

          <SensitivityTornado indices={result.indices} method={resultMethod} topN={topN} />

          <details>
            <summary className="mono text-[12px] uppercase tracking-cap text-ink-2 cursor-pointer hover:text-ink-0 transition-colors">
              numeric indices
            </summary>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line">
                    {(resultMethod === "sobol"
                      ? ["Condition", "S1", "S1 conf", "ST", "ST conf"]
                      : ["Condition", "μ*", "σ"]
                    ).map((h) => (
                      <th key={h} className="label px-3 py-2 text-ink-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.indices.map((d) => (
                    <tr key={d.condition_id} className="border-b border-line/50 hover:bg-bg-2/50 transition-colors">
                      <td className="px-3 py-2 mono text-[13px] text-ink-0">{d.condition_label}</td>
                      {resultMethod === "sobol" ? (
                        <>
                          <td className="px-3 py-2 mono text-[13px] text-ink-1">{(d.s1 ?? 0).toFixed(4)}</td>
                          <td className="px-3 py-2 mono text-[13px] text-ink-2">{(d.s1_conf ?? 0).toFixed(4)}</td>
                          <td className="px-3 py-2 mono text-[13px] text-ink-1">{(d.st ?? 0).toFixed(4)}</td>
                          <td className="px-3 py-2 mono text-[13px] text-ink-2">{(d.st_conf ?? 0).toFixed(4)}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2 mono text-[13px] text-ink-1">{(d.mu_star ?? 0).toFixed(4)}</td>
                          <td className="px-3 py-2 mono text-[13px] text-ink-2">{(d.sigma ?? 0).toFixed(4)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

export function VVPanel() {
  return (
    <div className="fadein space-y-8">
      <EvidenceStatusSection />
      <ValidationSection />
      <div className="border-t border-line" />
      <SensitivitySection />
    </div>
  );
}
