import { useState } from "react";
import { ANALOG_MISSIONS } from "@/data/analog-missions";
import { ANALOG_CONDITIONS } from "@/risk/conditions";
import { SYNTHETIC_PRIORS, synthesizeCrew } from "@/data/synthetic-iter3";
import { simulateMission, type RiskPosteriorWithDiagnostics } from "@/risk/simulate";
import { useWizard } from "@/contexts/WizardContext";
import { MissionPicker } from "@/ui/components/MissionPicker";
import { saveSimSession } from "@/db/repository";
import { notify } from "@/ui/components/Toast";
import type { AnalogMission } from "@/types/risk";

// NASA IMM canonical (M18 §Methods, A22 §149): T = 100,000 trials per mission.
// See docs/iter3_nasa_monte_carlo_audit.md for the literature audit + rationale
// for picking 100_000 as the default vs the cheaper preview tiers.
const TRIALS_OPTIONS = [5_000, 10_000, 25_000, 50_000, 100_000];
const NASA_CANONICAL_TRIALS = 100_000;

export function StepMissionSim({ onRunComplete }: { onRunComplete: (sessionId: string) => void }) {
  const { candidate, criterionEntries, markStepCompleted, accessTier } = useWizard();
  const [mission, setMission] = useState<AnalogMission | null>(null);
  const [trials, setTrials] = useState(NASA_CANONICAL_TRIALS);
  const [chiStar, setChiStar] = useState(0.7);
  const [seed, setSeed] = useState(0xc0ffee);
  const [running, setRunning] = useState(false);

  async function handleRun() {
    if (!mission || !candidate) return;
    setRunning(true);

    // Double-rAF + microtask yield: the FIRST frame paints the overlay
    // (setRunning(true) → React re-renders → browser paints). Only on the
    // SECOND frame do we start the ~10s synchronous Monte-Carlo loop. Without
    // this the overlay never gets a chance to paint and the page LOOKS blank
    // for the whole freeze. See docs/iter3_nasa_monte_carlo_audit.md.
    requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        try {
          const scores: Record<string, number> = {};
          for (const e of criterionEntries) scores[e.criterionId] = e.rawValue;
          const template = { id: candidate.id, alias: candidate.alias, scores };
          const crew = synthesizeCrew(template, mission.crewSize);
          const post: RiskPosteriorWithDiagnostics = simulateMission(
            crew,
            mission,
            SYNTHETIC_PRIORS,
            ANALOG_CONDITIONS,
            { seed, trials, chiStar, diagnostics: true },
          );
          const session = await saveSimSession({
            candidateId: candidate.id,
            missionId: mission.id,
            trials,
            chiStar,
            seed,
            priorsVersion: SYNTHETIC_PRIORS.model_version,
            posterior: {
              chi: post.chi,
              pEarlyTermination: post.pEarlyTermination,
              expectedLostCrewDays: post.expectedLostCrewDays,
              perConditionQTL: post.perConditionQTL,
              ess: post.ess,
              trials: post.trials,
            },
            chiSamples: post.diagnostics?.chiSamples ?? [],
            qtlSamples: post.diagnostics?.qtlSamples ?? [],
            notes: `tier=${accessTier}`,
          });
          markStepCompleted(3);
          onRunComplete(session.id);
        } catch (err) {
          const msg = (err as Error).message || "simulation failed (unknown error)";
          notify(msg, "error");
          setRunning(false); // ensure UI recovers even on error
        }
      });
    });
  }

  // Rough wall-clock estimate for the progress overlay. Calibrated against
  // T57's measurement: 100k × 12 conditions × 6 crew ≈ 10s on commodity laptop.
  // Scales linearly with `trials` (the dominant factor).
  const estSeconds =
    mission && trials >= 5_000
      ? Math.max(1, Math.round((trials * mission.crewSize * 12) / 720_000))
      : null;

  return (
    <div className="space-y-4">
      {/* FULL-SCREEN PROGRESS OVERLAY during the simulation.
          Painted by the FIRST rAF before the heavy work starts in the second. */}
      {running && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg-0/80 backdrop-blur-sm"
          role="alertdialog"
          aria-live="polite"
          aria-label="Simulation in progress"
        >
          <div className="panel p-8 max-w-md text-center border-signal/40 shadow-[0_0_48px_rgba(245,181,65,0.25)]">
            {/* Pulsing spinner */}
            <div className="mb-5 flex justify-center">
              <span className="relative inline-flex h-12 w-12">
                <span className="absolute inset-0 rounded-full border-2 border-signal/30" />
                <span className="absolute inset-0 rounded-full border-2 border-signal border-t-transparent animate-spin" />
              </span>
            </div>
            <h3 className="display text-lg text-ink-0 mb-1">Running Monte-Carlo simulation</h3>
            <p className="mono text-[11px] text-ink-2 mb-3">
              {trials.toLocaleString()} trials ·{" "}
              {mission ? `${mission.crewSize} crew × ${ANALOG_CONDITIONS.length} conditions` : "?"}
              {estSeconds ? ` · ~${estSeconds}s` : ""}
            </p>
            <p className="text-sm text-ink-1 leading-relaxed">
              The browser main thread is locked for the duration — this is expected
              and the page may not respond to clicks until the run finishes.
            </p>
            <p className="mono mt-3 text-[10px] text-ink-3 uppercase tracking-cap">
              NASA canonical T = 100,000 per M18 / A22 · see iter3 audit doc
            </p>
          </div>
        </div>
      )}

      <div className="panel p-6 space-y-4">
        <h2 className="display text-lg">Step 4 — Mission &amp; sim</h2>
        <MissionPicker missions={ANALOG_MISSIONS as AnalogMission[]} selected={mission} onChange={setMission} />
        {mission && (
          <div className="mono grid grid-cols-2 gap-y-1 text-[11px] text-ink-2 sm:grid-cols-4">
            <div>duration · <span className="text-ink-0">{mission.durationDays} d</span></div>
            <div>crew · <span className="text-ink-0">{mission.crewSize}</span></div>
            <div>EVAs · <span className="text-ink-0">{mission.evaCount}</span></div>
            <div>comms delay · <span className="text-ink-0">{mission.commsDelaySec} s</span></div>
          </div>
        )}
      </div>

      <div className="panel p-6 space-y-4">
        <h3 className="label">sim config</h3>
        <div className="grid grid-cols-3 gap-4">
          <label>
            <span className="label">trials</span>
            <select
              value={trials}
              onChange={(e) => setTrials(parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border border-line bg-bg-1 px-3 py-2 text-sm text-ink-0"
            >
              {TRIALS_OPTIONS.map((t) => <option key={t} value={t}>{t.toLocaleString()}</option>)}
            </select>
          </label>
          <label>
            <span className="label">χ* threshold</span>
            <input
              type="range"
              min={0.5}
              max={0.9}
              step={0.01}
              value={chiStar}
              onChange={(e) => setChiStar(parseFloat(e.target.value))}
              className="mt-1 w-full accent-signal"
            />
            <span className="mono tabular-nums text-ink-0">{chiStar.toFixed(2)}</span>
          </label>
          <label>
            <span className="label">seed</span>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border border-line bg-bg-1 px-3 py-2 text-sm text-ink-0"
            />
          </label>
        </div>

        <button
          onClick={handleRun}
          disabled={!mission || running}
          className={
            "mono uppercase tracking-cap text-[11px] px-4 py-2 border rounded-md transition-colors " +
            (mission && !running
              ? "border-signal text-signal hover:bg-signal/10"
              : "border-line text-ink-3 cursor-not-allowed")
          }
        >
          {running ? "computing…" : "▶ Run simulation"}
        </button>
      </div>
    </div>
  );
}
