// src/contexts/CalibrationJobsContext.tsx
//
// Persistent job state for the Python Calibration API (fit / validation /
// sensitivity). Mounted at the app root — ABOVE the view switcher — so its
// polling loop and results survive leaving the Calibration tab and even a
// full page refresh (Diego 2026-05-29: "make calibration runs persist… give
// the results despite not being on that particular tab").
//
// The computation already runs server-side (the API returns a job_id and we
// poll). The only thing that was being lost on tab-switch was the *frontend*
// job handle + result, because the panels held it in local state and unmounted.
// This provider lifts that handle out of the views and persists it.

import {
  createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode,
} from "react";
import {
  type FitRequest, type ValidateRequest, type SensitivityRequest,
  type BatchFitResult, type ValidateResponse, type SensitivityResponse,
  type JobStatusResponse,
  startFit, getFitStatus,
  startValidation, getValidationStatus,
  startSensitivity, getSensitivityStatus,
} from "@/api/calibration";

export type JobKind = "fit" | "validation" | "sensitivity";
export type JobStatus = "idle" | "queued" | "running" | "done" | "failed";

export interface CalibrationJob<R = unknown> {
  jobId: string | null;
  status: JobStatus;
  result: R | null;
  error: string | null;
  startedAt: number | null; // epoch ms — for the elapsed-time readout
  finishedAt: number | null;
}

const IDLE: CalibrationJob = {
  jobId: null, status: "idle", result: null, error: null, startedAt: null, finishedAt: null,
};

type Slots = Record<JobKind, CalibrationJob>;
const INITIAL_SLOTS: Slots = { fit: { ...IDLE }, validation: { ...IDLE }, sensitivity: { ...IDLE } };

interface CalibrationJobsValue {
  fit: CalibrationJob<BatchFitResult>;
  validation: CalibrationJob<ValidateResponse>;
  sensitivity: CalibrationJob<SensitivityResponse>;
  startFitJob: (req: FitRequest) => Promise<void>;
  startValidationJob: (req: ValidateRequest) => Promise<void>;
  startSensitivityJob: (req: SensitivityRequest) => Promise<void>;
  clearJob: (kind: JobKind) => void;
}

const Ctx = createContext<CalibrationJobsValue | null>(null);

const PERSIST_KEY = "selectron:calibration-jobs:v1";
const POLL_MS = 2500;

const STATUS_FN: Record<JobKind, (id: string) => Promise<JobStatusResponse>> = {
  fit: getFitStatus,
  validation: getValidationStatus,
  sensitivity: getSensitivityStatus,
};

function loadSlots(): Slots {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return INITIAL_SLOTS;
    const p = JSON.parse(raw) as Partial<Slots>;
    return {
      fit: p.fit ?? { ...IDLE },
      validation: p.validation ?? { ...IDLE },
      sensitivity: p.sensitivity ?? { ...IDLE },
    };
  } catch {
    return INITIAL_SLOTS;
  }
}

export function CalibrationJobsProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<Slots>(loadSlots);
  // Mirror in a ref so the single polling interval always reads current state
  // without being torn down/recreated on every status patch.
  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  // Persist on every change so a refresh restores in-flight + completed jobs.
  useEffect(() => {
    try { localStorage.setItem(PERSIST_KEY, JSON.stringify(slots)); } catch { /* ignore */ }
  }, [slots]);

  const patch = useCallback((kind: JobKind, p: Partial<CalibrationJob>) => {
    setSlots((s) => ({ ...s, [kind]: { ...s[kind], ...p } }));
  }, []);

  const poll = useCallback(async (kind: JobKind, jobId: string) => {
    try {
      const st = await STATUS_FN[kind](jobId);
      if (slotsRef.current[kind].jobId !== jobId) return; // superseded
      if (st.status === "done") {
        patch(kind, { status: "done", result: st.result as unknown, error: null, finishedAt: Date.now() });
      } else if (st.status === "failed") {
        patch(kind, { status: "failed", error: st.error ?? "Job failed", finishedAt: Date.now() });
      } else {
        patch(kind, { status: st.status }); // queued | running
      }
    } catch (e) {
      if (slotsRef.current[kind].jobId !== jobId) return;
      patch(kind, { status: "failed", error: e instanceof Error ? e.message : String(e), finishedAt: Date.now() });
    }
  }, [patch]);

  // ── single continuous polling loop (lifetime of the provider) ────────────
  // Reads slotsRef each tick and polls every active (queued/running) job. Set
  // up once; never torn down by status changes → no interval churn. When no
  // job is active it ticks harmlessly.
  useEffect(() => {
    const t = setInterval(() => {
      const s = slotsRef.current;
      (Object.keys(s) as JobKind[]).forEach((k) => {
        const slot = s[k];
        if (slot.jobId && (slot.status === "queued" || slot.status === "running")) {
          void poll(k, slot.jobId);
        }
      });
    }, POLL_MS);
    return () => clearInterval(t);
  }, [poll]);

  // On mount, immediately poll any job restored from localStorage that was
  // still in flight (don't wait a full POLL_MS for the first refresh).
  useEffect(() => {
    (Object.keys(slotsRef.current) as JobKind[]).forEach((k) => {
      const slot = slotsRef.current[k];
      if (slot.jobId && (slot.status === "queued" || slot.status === "running")) {
        void poll(k, slot.jobId);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const begin = useCallback((kind: JobKind, jobId: string) => {
    patch(kind, {
      jobId, status: "running", result: null, error: null, startedAt: Date.now(), finishedAt: null,
    });
    void poll(kind, jobId); // immediate first check
  }, [patch, poll]);

  const startKind = useCallback(
    async (kind: JobKind, start: () => Promise<{ job_id: string }>) => {
      patch(kind, { status: "queued", result: null, error: null, startedAt: Date.now(), finishedAt: null, jobId: null });
      try {
        const res = await start();
        begin(kind, res.job_id);
      } catch (e) {
        patch(kind, { status: "failed", error: e instanceof Error ? e.message : String(e), finishedAt: Date.now() });
      }
    },
    [patch, begin],
  );

  const startFitJob = useCallback((req: FitRequest) => startKind("fit", () => startFit(req)), [startKind]);
  const startValidationJob = useCallback((req: ValidateRequest) => startKind("validation", () => startValidation(req)), [startKind]);
  const startSensitivityJob = useCallback((req: SensitivityRequest) => startKind("sensitivity", () => startSensitivity(req)), [startKind]);

  const clearJob = useCallback((kind: JobKind) => patch(kind, { ...IDLE }), [patch]);

  return (
    <Ctx.Provider
      value={{
        fit: slots.fit as CalibrationJob<BatchFitResult>,
        validation: slots.validation as CalibrationJob<ValidateResponse>,
        sensitivity: slots.sensitivity as CalibrationJob<SensitivityResponse>,
        startFitJob,
        startValidationJob,
        startSensitivityJob,
        clearJob,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCalibrationJobs(): CalibrationJobsValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCalibrationJobs must be used within CalibrationJobsProvider");
  return ctx;
}
