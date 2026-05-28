import { useCallback, useEffect, useRef, useState } from "react";
import {
  type MetricResult,
  type ValidateResponse,
  type SensitivityResponse,
  startValidation,
  getValidationStatus,
  startSensitivity,
  getSensitivityStatus,
} from "@/api/calibration";
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

function StatusBadge({ pass }: { pass: boolean }) {
  return pass ? (
    <span className="mono text-[10px] uppercase tracking-cap text-go">pass</span>
  ) : (
    <span className="mono text-[10px] uppercase tracking-cap text-warn">fail</span>
  );
}

function SummaryBadge({ n, total }: { n: number; total: number }) {
  const color = n >= 6 ? "text-go" : n >= 3 ? "text-signal" : "text-warn";
  return (
    <span className={`label ${color}`}>
      {n}/{total} within K15 CI₉₅
    </span>
  );
}

function ValidationSection() {
  const [trials, setTrials] = useState(10_000);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ValidateResponse | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (!running || !startTime) return;
    const t = setInterval(() => {
      if (mounted.current) setElapsed(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(t);
  }, [running, startTime]);

  const checkJob = useCallback(async (jobId: string) => {
    try {
      const status = await getValidationStatus(jobId);
      if (!mounted.current) return;
      if (status.status === "done" && status.result) {
        setResult(status.result as unknown as ValidateResponse);
        setRunning(false);
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      } else if (status.status === "failed") {
        setError(status.error ?? "Unknown error");
        setRunning(false);
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : String(e));
      setRunning(false);
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
  }, []);

  async function handleRun() {
    setError(null);
    setResult(null);
    setElapsed(0);
    setRunning(true);
    setStartTime(Date.now());
    try {
      const res = await startValidation({ trials, seed });
      if (!mounted.current) return;
      if (res.status === "done") {
        await checkJob(res.job_id);
      } else {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(() => checkJob(res.job_id), 2000);
      }
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : String(e));
      setRunning(false);
    }
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
                className={`mono text-[10px] px-2 py-1 border rounded-sm transition-colors ${
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
            className="mono text-[11px] bg-bg-1 border border-line text-ink-1 px-2 py-1.5 rounded-sm focus:outline-none focus:border-signal w-28"
          />
        </div>
        <button
          type="button"
          disabled={running}
          onClick={handleRun}
          className={`mono uppercase tracking-cap text-[11px] px-4 py-2 border rounded-sm transition-colors ${
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
            <span className="mono text-[11px] text-ink-2">{fmtDuration(elapsed)}</span>
          </span>
        )}
      </div>

      {error && (
        <div className="panel p-4 border-warn/50">
          <p className="mono text-[11px] text-warn">{error}</p>
        </div>
      )}

      {result && (
        <div className="panel p-6 fadein space-y-4">
          <div className="flex items-baseline gap-x-3">
            <h4 className="display text-lg text-ink-0 tracking-tight">Results</h4>
            <SummaryBadge n={result.n_within_ci95} total={result.n_total} />
            <span className="mono text-[10px] text-ink-3 ml-auto">
              T={result.trials.toLocaleString()} · {fmtDuration(elapsed)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line">
                  {["Metric", "Observed", "Reference", "CI₉₅", "Δ", "Status"].map((h) => (
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
                      <td colSpan={6} className="px-3 py-1.5 mono text-[10px] uppercase tracking-cap text-ink-2">
                        {scenario}
                      </td>
                    </tr>,
                    ...metrics.map((m) => (
                      <tr key={`${scenario}-${m.metric}`} className="border-b border-line/50 hover:bg-bg-2/50 transition-colors">
                        <td className="px-3 py-2 mono text-[11px] text-ink-0">{m.metric}</td>
                        <td className="px-3 py-2 mono text-[11px] text-ink-1">{m.observed.toFixed(2)}</td>
                        <td className="px-3 py-2 mono text-[11px] text-ink-1">{m.reference.toFixed(2)}</td>
                        <td className="px-3 py-2 mono text-[11px] text-ink-2">
                          [{m.ci95_low.toFixed(2)}, {m.ci95_high.toFixed(2)}]
                        </td>
                        <td className="px-3 py-2 mono text-[11px] text-ink-1">{m.delta >= 0 ? "+" : ""}{m.delta.toFixed(2)}</td>
                        <td className="px-3 py-2"><StatusBadge pass={m.within_ci95} /></td>
                      </tr>
                    )),
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
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SensitivityResponse | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (!running || !startTime) return;
    const t = setInterval(() => {
      if (mounted.current) setElapsed(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(t);
  }, [running, startTime]);

  const checkJob = useCallback(async (jobId: string) => {
    try {
      const status = await getSensitivityStatus(jobId);
      if (!mounted.current) return;
      if (status.status === "done" && status.result) {
        setResult(status.result as unknown as SensitivityResponse);
        setRunning(false);
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      } else if (status.status === "failed") {
        setError(status.error ?? "Unknown error");
        setRunning(false);
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : String(e));
      setRunning(false);
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
  }, []);

  async function handleRun() {
    setError(null);
    setResult(null);
    setElapsed(0);
    setRunning(true);
    setStartTime(Date.now());
    try {
      const res = await startSensitivity({
        method,
        n_samples: nSamples,
        trials: trialsPerEval,
        seed,
        top_n: topN,
      });
      if (!mounted.current) return;
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => checkJob(res.job_id), 3000);
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : String(e));
      setRunning(false);
    }
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
                className={`mono text-[10px] px-2 py-1 border rounded-sm transition-colors ${
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
              className="mono text-[11px] bg-bg-1 border border-line text-ink-1 px-2 py-1.5 rounded-sm focus:outline-none focus:border-signal w-24"
            />
          </div>
        ))}
        <div className="flex flex-col gap-1">
          <label className="label text-ink-3">top N</label>
          <select
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            className="mono text-[11px] bg-bg-1 border border-line text-ink-1 px-2 py-1.5 rounded-sm focus:outline-none focus:border-signal cursor-pointer"
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
          className={`mono uppercase tracking-cap text-[11px] px-4 py-2 border rounded-sm transition-colors ${
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
            <span className="mono text-[11px] text-ink-2">{fmtDuration(elapsed)}</span>
          </span>
        )}
      </div>

      {error && (
        <div className="panel p-4 border-warn/50">
          <p className="mono text-[11px] text-warn">{error}</p>
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

          <SensitivityTornado indices={result.indices} method={method} topN={topN} />

          <details>
            <summary className="mono text-[10px] uppercase tracking-cap text-ink-2 cursor-pointer hover:text-ink-0 transition-colors">
              numeric indices
            </summary>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line">
                    {(method === "sobol"
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
                      <td className="px-3 py-2 mono text-[11px] text-ink-0">{d.condition_label}</td>
                      {method === "sobol" ? (
                        <>
                          <td className="px-3 py-2 mono text-[11px] text-ink-1">{(d.s1 ?? 0).toFixed(4)}</td>
                          <td className="px-3 py-2 mono text-[11px] text-ink-2">{(d.s1_conf ?? 0).toFixed(4)}</td>
                          <td className="px-3 py-2 mono text-[11px] text-ink-1">{(d.st ?? 0).toFixed(4)}</td>
                          <td className="px-3 py-2 mono text-[11px] text-ink-2">{(d.st_conf ?? 0).toFixed(4)}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2 mono text-[11px] text-ink-1">{(d.mu_star ?? 0).toFixed(4)}</td>
                          <td className="px-3 py-2 mono text-[11px] text-ink-2">{(d.sigma ?? 0).toFixed(4)}</td>
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
      <ValidationSection />
      <div className="border-t border-line" />
      <SensitivitySection />
    </div>
  );
}
