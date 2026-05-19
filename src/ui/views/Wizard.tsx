import { WizardProvider, useWizard, type WizardStep } from "@/contexts/WizardContext";
import { StepStrip } from "../wizard/StepStrip";
import { StepIdentity } from "../wizard/StepIdentity";
import { StepCriteria } from "../wizard/StepCriteria";
import { StepReview } from "../wizard/StepReview";
import { notify } from "@/ui/components/Toast";

function Breadcrumb({
  alias,
  step,
  onExitToDashboard,
}: {
  alias: string;
  step: WizardStep;
  onExitToDashboard: () => void;
}) {
  return (
    <div className="border-b border-line/40 px-8 py-3">
      <div className="mx-auto max-w-7xl">
        <div className="mono text-[11px] uppercase tracking-cap text-ink-2 flex items-center gap-2">
          <button onClick={onExitToDashboard} className="hover:text-signal">
            dashboard
          </button>
          <span className="text-ink-3">›</span>
          <span className="text-ink-1">{alias.toLowerCase()}</span>
          <span className="text-ink-3">›</span>
          <span className="text-ink-0">step {step + 1} of 4</span>
        </div>
      </div>
    </div>
  );
}

function WizardBody({ onExitToDashboard }: { onExitToDashboard: () => void; onExitToSim: () => void }) {
  const { step, candidate, enqueueCandidatePatch } = useWizard();
  if (!candidate) return <div className="p-12 text-ink-2">loading candidate…</div>;

  return (
    <>
      <Breadcrumb alias={candidate.alias} step={step} onExitToDashboard={onExitToDashboard} />
      <StepStrip />
      <div className="mt-6">
        {step === 0 && <StepIdentity />}
        {step === 1 && <StepCriteria />}
        {step === 2 && <StepReview />}
        {step === 3 && <div className="panel p-6 text-sm text-ink-2">Step 4 Mission & sim — Task 77</div>}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <button onClick={onExitToDashboard} className="mono text-[11px] uppercase text-ink-2 hover:text-ink-0">
          ← back to dashboard
        </button>
        {(step === 2 || step === 3) && candidate.status === "draft" && (
          <button
            onClick={() => {
              enqueueCandidatePatch({ status: "ready" });
              notify("marked ready");
            }}
            className="mono uppercase tracking-cap text-[11px] px-3 py-2 border border-signal text-signal hover:bg-signal/10 rounded-md"
          >
            Mark ready
          </button>
        )}
      </div>
    </>
  );
}

export function Wizard(props: {
  candidateId: string;
  initialStep: WizardStep;
  onExitToDashboard: () => void;
  onExitToSim: (id: string) => void;
}) {
  return (
    <WizardProvider candidateId={props.candidateId} initialStep={props.initialStep}>
      <WizardBody
        onExitToDashboard={props.onExitToDashboard}
        onExitToSim={() => props.onExitToSim(props.candidateId)}
      />
    </WizardProvider>
  );
}
