import { useState } from "react";
import { flushSync } from "react-dom";
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

    // Why this dance:
    //   The previous double-rAF pattern doesn't guarantee the overlay paints
    //   before the heavy work starts. React 18's setState is async: even after
    //   two rAFs, the commit may still be pending while the heavy work begins,
    //   so the user sees a frozen wizard (= "page goes blank") for the whole
    //   ~10s freeze. Fix:
    //
    //   1. `flushSync(setRunning(true))` — FORCES React to commit the re-render
    //      synchronously. The overlay is in the DOM after this call returns.
    //   2. `await new Promise(r => requestAnimationFrame(...))` — yields to the
    //      browser so it can actually PAINT the overlay (commit ≠ paint).
    //   3. `await new Promise(r => setTimeout(r, 50))` — belt-and-suspenders
    //      additional yield. On slower devices the paint can take 1–2 frames;
    //      50 ms is well within human-perception threshold and well over the
    //      paint budget. Total overhead: <100 ms vs ~10 s simulation = noise.
    //
    //   Only AFTER both yields complete do we kick off the heavy work.
    flushSync(() => setRunning(true));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => setTimeout(resolve, 50));

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
      // Surface the full error to the console for Diego's debugging — silent
      // catches were a previous suspected cause of the "blank page" report.
      // eslint-disable-next-line no-console
      console.error("[Selectron] simulation failed:", err);
      notify(msg, "error");
      setRunning(false); // ensure UI recovers from any error
    }
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
          flushSync(setRunning(true)) + rAF yield + setTimeout(50ms) above
          guarantees this overlay is painted before the main thread freezes.
          Solid opaque background — backdrop-blur was removed because GPU-bound
          paint effects can delay the visible state past the JS lock. */}
      {running && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          role="alertdialog"
          aria-live="polite"
          aria-label="Simulation in progress"
          style={{
            backgroundColor: "rgba(8, 9, 10, 0.96)", // near-solid bg-0
            // explicit inline styles defeat any parent CSS containment context
            // that might trap `fixed inset-0`
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <div className="panel p-8 max-w-md text-center border-signal shadow-[0_0_64px_rgba(245,181,65,0.35)]">
            {/* Pulsing spinner */}
            <div className="mb-5 flex justify-center">
              <span className="relative inline-flex h-14 w-14">
                <span className="absolute inset-0 rounded-full border-2 border-signal/30" />
                <span className="absolute inset-0 rounded-full border-2 border-signal border-t-transparent animate-spin" />
              </span>
            </div>
            <h3 className="display text-xl text-ink-0 mb-2">Running Monte-Carlo simulation</h3>
            <p className="mono text-[14px] text-ink-1 mb-3 tabular-nums">
              {trials.toLocaleString()} trials ·{" "}
              {mission ? `${mission.crewSize} crew × ${ANALOG_CONDITIONS.length} conditions` : "?"}
              {estSeconds ? ` · ~${estSeconds}s` : ""}
            </p>
            <p className="text-sm text-ink-1 leading-relaxed">
              The browser main thread is locked for the duration — this is expected
              and the page may not respond to clicks until the run finishes.
            </p>
            <p className="mono mt-4 text-[12px] text-ink-3 uppercase tracking-cap">
              NASA canonical T = 100,000 per M18 / A22 · see iter3 audit doc
            </p>
            <p className="mono mt-2 text-[12px] text-ink-3 leading-relaxed">
              Tip: dial trials down to 25,000 in the dropdown for a faster preview
              run if you don't need the full NASA-canonical precision.
            </p>
          </div>
        </div>
      )}

      <div className="panel p-6 space-y-4">
        <h2 className="display text-lg">Step 4 — Mission &amp; sim</h2>
        <MissionPicker missions={ANALOG_MISSIONS as AnalogMission[]} selected={mission} onChange={setMission} />
        {mission && (
          <div className="mono grid grid-cols-2 gap-y-1 text-[13px] text-ink-2 sm:grid-cols-4">
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
            "mono uppercase tracking-cap text-[13px] px-4 py-2 border rounded-md transition-colors " +
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
