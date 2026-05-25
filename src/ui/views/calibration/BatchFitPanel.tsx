import { useCallback, useEffect, useRef, useState } from "react";
import {
  type FitRequest,
  type FitResult,
  type JobStatusResponse,
  startFit,
  getFitStatus,
} from "@/api/calibration";

const STORAGE_KEY = "selectron:activeFitJob";

function loadStoredJobId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveStoredJobId(id: string | null) {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

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
  const [conditionFilter, setConditionFilter] = useState("");
  const [job, setJob] = useState<JobStatusResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // Resume polling if a job is stored on mount
  useEffect(() => {
    const storedId = loadStoredJobId();
    if (storedId) {
      checkJob(storedId);
    }
  }, []);

  // Elapsed timer
  useEffect(() => {
    if (!running || !startTime) return;
    const t = setInterval(() => {
      if (mounted.current) setElapsed(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(t);
  }, [running, startTime]);

  const checkJob = useCallback(async (jobId: string) => {
    try {
      const status = await getFitStatus(jobId);
      if (!mounted.current) return;
      setJob(status);
      if (status.status === "done" || status.status === "failed") {
        setRunning(false);
        saveStoredJobId(null);
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : String(e));
      setRunning(false);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }, []);

  async function handleStart() {
    setError(null);
    setJob(null);
    setElapsed(0);
    const req: FitRequest = {
      draws,
      chains,
      seed,
      condition_id: conditionFilter.trim() || null,
    };
    try {
      const res = await startFit(req);
      if (!mounted.current) return;
      saveStoredJobId(res.job_id);
      setRunning(true);
      setStartTime(Date.now());
      // Immediate first check
      await checkJob(res.job_id);
      // Then poll every 2s
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => checkJob(res.job_id), 2000);
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const fittedEntries: [string, FitResult][] = job?.result?.fitted
    ? Object.entries(job.result.fitted)
    : [];

  return (
    <div className="fadein space-y-6">
      {/* Config form */}
      <div className="panel p-6">
        <div className="flex items-baseline gap-x-3 mb-5">
          <h3 className="display text-xl text-ink-0 tracking-tight">Batch Fit</h3>
          <span className="label text-ink-3">PyMC NUTS · Gamma-Poisson</span>
        </div>

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
                className="mono text-[11px] bg-bg-1 border border-line text-ink-1 px-2 py-1.5 rounded-sm focus:outline-none focus:border-signal"
              />
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <label className="label text-ink-3">condition filter (optional)</label>
            <input
              type="text"
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              placeholder="e.g. depression"
              className="mono text-[11px] bg-bg-1 border border-line text-ink-1 px-2 py-1.5 rounded-sm focus:outline-none focus:border-signal placeholder:text-ink-3"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={running}
            onClick={handleStart}
            className={`mono uppercase tracking-cap text-[11px] px-4 py-2 border rounded-sm transition-colors ${
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
              <span className="mono text-[11px] text-ink-2">
                {job?.status ?? "queued"} · {fmtDuration(elapsed)}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="panel p-6 border-warn/50">
          <p className="mono text-[11px] uppercase tracking-cap text-warn mb-1">API Error</p>
          <p className="mono text-[11px] text-ink-1">{error}</p>
        </div>
      )}

      {/* Job result */}
      {job?.status === "done" && (
        <div className="panel p-6 fadein">
          <div className="flex items-baseline gap-x-3 mb-4">
            <h4 className="display text-lg text-ink-0 tracking-tight">Results</h4>
            <span className="label text-go">
              {job.result?.n_fitted} fitted · {job.result?.n_failed} failed
            </span>
            <span className="mono text-[10px] text-ink-3 ml-auto">
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
                        <div className="mono text-[11px] text-ink-0">{cid}</div>
                      </td>
                      <td className="px-3 py-2 mono text-[11px] text-ink-1">
                        {r.posterior_lambda_mean.toExponential(3)}
                      </td>
                      <td className="px-3 py-2 mono text-[11px] text-ink-1">
                        {r.posterior_alpha.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 mono text-[11px] text-ink-1">
                        {r.posterior_beta.toFixed(2)}
                      </td>
                      <td className={`px-3 py-2 mono text-[11px] ${classForRhat(r.r_hat)}`}>
                        {r.r_hat.toFixed(4)}
                      </td>
                      <td className="px-3 py-2 mono text-[11px] text-ink-1">
                        {Math.round(r.ess_bulk)}
                      </td>
                      <td className={`px-3 py-2 mono text-[11px] ${classForDivs(r.divergences)}`}>
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

      {job?.status === "failed" && (
        <div className="panel p-6 border-warn/50 fadein">
          <p className="mono text-[11px] uppercase tracking-cap text-warn mb-1">Job Failed</p>
          <p className="mono text-[11px] text-ink-1">{job.error ?? "Unknown error"}</p>
        </div>
      )}
    </div>
  );
}
