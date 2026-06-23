import { useWizard } from "@/contexts/WizardContext";

type Props = {
  onOpenCrewComposition: () => void;
};

export function StepMissionSim({ onOpenCrewComposition }: Props) {
  const { candidate, markStepCompleted, enqueueCandidatePatch } = useWizard();

  function handleFinish() {
    markStepCompleted(3);
    enqueueCandidatePatch({ status: "ready" });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-8">
      <section className="panel p-6 space-y-4">
        <div>
          <h2 className="display text-lg">Step 4 — Team simulation handoff</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            Candidate scoring is complete for {candidate?.alias ?? "this candidate"}. Stage-B
            medical simulation is only run for a documented crew in Crew Composition, where
            the IMM engine uses analog mission profiles and keeps trait coupling off by default.
          </p>
        </div>

        <div className="rounded-sm border border-line bg-bg-1 p-4">
          <h3 className="label text-ink-1 uppercase tracking-cap">Scientific production mode</h3>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-2">
            <li>No single-candidate medical prediction is generated from Stage-A scores.</li>
            <li>No candidate is cloned into a synthetic crew for production results.</li>
            <li>No applicant verdict is produced.</li>
            <li>Team-level scenario analysis belongs in Crew Composition after the crew is defined.</li>
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleFinish}
            className="mono rounded-md border border-signal px-4 py-2 text-[13px] uppercase tracking-cap text-signal transition-colors hover:bg-signal/10"
          >
            Mark candidate ready
          </button>
          <button
            type="button"
            onClick={() => {
              handleFinish();
              onOpenCrewComposition();
            }}
            className="mono rounded-md border border-line px-4 py-2 text-[13px] uppercase tracking-cap text-ink-1 transition-colors hover:border-signal hover:text-signal"
          >
            Open Crew Composition
          </button>
        </div>
      </section>
    </div>
  );
}
