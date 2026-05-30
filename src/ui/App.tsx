import { useEffect, useState } from "react";
import { DbProvider } from "@/contexts/DbContext";
import { CalibrationJobsProvider, useCalibrationJobs } from "@/contexts/CalibrationJobsContext";
import { createCandidate } from "@/db/repository";
import { Dashboard } from "./views/Dashboard";
import { Wizard } from "./views/Wizard";
import { Sim } from "./views/Sim";
import { CrewComposition } from "./views/CrewComposition";
import { Calibration } from "./views/Calibration";
import { ToastHost } from "./components/Toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { TestFigureHost } from "./testing/TestFigureHost";

const SEED_SAMPLER = 0xc0ffee;

type View =
  | { kind: "dashboard" }
  | { kind: "wizard"; candidateId: string; step: 0 | 1 | 2 | 3 }
  | { kind: "sim"; candidateId: string }
  | { kind: "crew-composition" }
  | { kind: "calibration" };

function useUtcClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const fmtUtc = (d: Date) => d.toISOString().slice(11, 19) + "Z";
const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Pulsing dot on the Calibration nav button — visible whenever a fit /
 * validation / sensitivity job is running in the background, so the user
 * knows a run is still in flight even from another tab. Rendered inside
 * CalibrationJobsProvider (it's in the header), so the hook resolves.
 */
function CalibrationActivityDot() {
  const { fit, validation, sensitivity } = useCalibrationJobs();
  const active = [fit, validation, sensitivity].some(
    (j) => j.status === "queued" || j.status === "running",
  );
  if (!active) return null;
  return (
    <span
      className="signal-dot"
      title="A calibration job is running in the background"
      aria-label="calibration job running"
    />
  );
}

export function App() {
  const [view, setView] = useState<View>({ kind: "dashboard" });

  const utc = useUtcClock();

  // DEV-only test harness: ?testFigure=F1..F7 renders a figure in isolation
  // for Playwright visual snapshot tests. Stripped in production builds.
  if (import.meta.env.DEV) {
    const testFigure = new URLSearchParams(location.search).get("testFigure");
    if (testFigure) {
      return <TestFigureHost figureId={testFigure} />;
    }
  }

  return (
    <DbProvider>
     <CalibrationJobsProvider>
      <div className="min-h-screen text-ink-0">
        {/* HEADER ─────────────────────────────────────────────────────────────── */}
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1
                className="display text-2xl text-ink-0 tracking-tight cursor-pointer"
                onClick={() => setView({ kind: "dashboard" })}
              >
                SELECTRON
              </h1>
              <span className="mono text-[13px] uppercase tracking-cap text-ink-1">
                by <span className="text-ink-0">Diego Malpica MD</span>
              </span>
              <span className="label text-signal">iter 03 · phase 3f</span>
            </div>
            <div className="mono flex items-center gap-4 text-[13px] text-ink-2">
              {/* Nav links */}
              <button
                className={`uppercase tracking-cap transition-colors ${
                  view.kind === "dashboard"
                    ? "text-signal border-b border-signal pb-0.5"
                    : "text-ink-2 hover:text-ink-0"
                }`}
                onClick={() => setView({ kind: "dashboard" })}
              >
                Candidates
              </button>
              <button
                className={`uppercase tracking-cap transition-colors ${
                  view.kind === "crew-composition"
                    ? "text-signal border-b border-signal pb-0.5"
                    : "text-ink-2 hover:text-ink-0"
                }`}
                onClick={() => setView({ kind: "crew-composition" })}
              >
                Crew
              </button>
              <button
                className={`uppercase tracking-cap transition-colors inline-flex items-center gap-1.5 ${
                  view.kind === "calibration"
                    ? "text-signal border-b border-signal pb-0.5"
                    : "text-ink-2 hover:text-ink-0"
                }`}
                onClick={() => setView({ kind: "calibration" })}
              >
                Calibration
                <CalibrationActivityDot />
              </button>
              {/* UTC clock + meta */}
              <div className="flex items-center gap-2 hidden sm:flex">
                <span className="signal-dot" />
                <span className="uppercase tracking-cap text-ink-1">live</span>
              </div>
              <span className="hidden sm:inline">
                <span className="text-ink-3">utc</span> {fmtUtc(utc)}
              </span>
              <span className="hidden md:inline">
                <span className="text-ink-3">build</span> {fmtDate(utc)}.bayes
              </span>
              <span className="hidden lg:inline">
                <span className="text-ink-3">seed</span> 0x{SEED_SAMPLER.toString(16)}
              </span>
            </div>
          </div>
        </header>

        {/* BODY ────────────────────────────────────────────────────────────────── */}
        <main className="mx-auto max-w-7xl px-8 py-10">
          {view.kind === "dashboard" && (
            <Dashboard
              onNewCandidate={async () => {
                const c = await createCandidate({ alias: "untitled" });
                await import("@/db/repository").then((m) =>
                  m.updateCandidate(c.id, { accessTier: "minimum" }),
                );
                setView({ kind: "wizard", candidateId: c.id, step: 0 });
              }}
              onEditCandidate={(id) => setView({ kind: "wizard", candidateId: id, step: 2 })}
              onSimCandidate={(id) => setView({ kind: "sim", candidateId: id })}
            />
          )}
          {view.kind === "wizard" && (
            <ErrorBoundary
              fallbackLabel="The wizard crashed during render"
              onReset={() => setView({ kind: "dashboard" })}
            >
              <Wizard
                candidateId={view.candidateId}
                initialStep={view.step}
                onExitToDashboard={() => setView({ kind: "dashboard" })}
                onExitToSim={(id) => setView({ kind: "sim", candidateId: id })}
              />
            </ErrorBoundary>
          )}
          {view.kind === "sim" && (
            <ErrorBoundary
              fallbackLabel="The Sim view crashed during render — your simulation IS saved, this is a display bug"
              onReset={() => setView({ kind: "dashboard" })}
            >
              <Sim
                candidateId={view.candidateId}
                onBackToReview={() => setView({ kind: "wizard", candidateId: view.candidateId, step: 2 })}
              />
            </ErrorBoundary>
          )}
          {view.kind === "crew-composition" && (
            <ErrorBoundary
              fallbackLabel="The Crew Composition view crashed during render"
              onReset={() => setView({ kind: "dashboard" })}
            >
              <CrewComposition />
            </ErrorBoundary>
          )}
          {view.kind === "calibration" && (
            <ErrorBoundary
              fallbackLabel="The Calibration view crashed during render"
              onReset={() => setView({ kind: "dashboard" })}
            >
              <Calibration />
            </ErrorBoundary>
          )}
        </main>

        {/* FOOTER ──────────────────────────────────────────────────────────────── */}
        <footer className="mt-10 border-t border-line">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-8 py-5">
            <div className="mono text-[12px] uppercase tracking-cap text-ink-3">
              selectron · iter 03 · bayesian mcda + mission-risk monte carlo
            </div>
            <div className="mono text-[12px] uppercase tracking-cap text-ink-3">
              <a
                href="https://github.com/strikerdlm/selectron"
                className="hover:text-signal transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                github.com/strikerdlm/selectron ↗
              </a>
            </div>
          </div>
        </footer>
        <ToastHost />
      </div>
     </CalibrationJobsProvider>
    </DbProvider>
  );
}
