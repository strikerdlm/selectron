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

const TRIALS_OPTIONS = [5_000, 10_000, 25_000, 50_000, 100_000];

export function StepMissionSim({ onRunComplete }: { onRunComplete: (sessionId: string) => void }) {
  const { candidate, criterionEntries, markStepCompleted } = useWizard();
  const [mission, setMission] = useState<AnalogMission | null>(null);
  const [trials, setTrials] = useState(25_000);
  const [chiStar, setChiStar] = useState(0.7);
  const [seed, setSeed] = useState(0xc0ffee);
  const [running, setRunning] = useState(false);

  async function handleRun() {
    if (!mission || !candidate) return;
    setRunning(true);
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
        });
        markStepCompleted(3);
        onRunComplete(session.id);
      } catch (err) {
        notify((err as Error).message, "error");
      } finally {
        setRunning(false);
      }
    });
  }

  return (
    <div className="space-y-4">
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
