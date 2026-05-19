import { WizardProvider, useWizard, type WizardStep } from "@/contexts/WizardContext";
import { StepStrip } from "../wizard/StepStrip";

function WizardBody({ onExitToDashboard }: { onExitToDashboard: () => void; onExitToSim: () => void }) {
  const { step, candidate } = useWizard();
  if (!candidate) return <div className="p-12 text-ink-2">loading candidate…</div>;

  return (
    <>
      <StepStrip />
      <div className="mt-6">
        {step === 0 && <div className="panel p-6 text-sm text-ink-2">Step 1 Identity — Task 73</div>}
        {step === 1 && <div className="panel p-6 text-sm text-ink-2">Step 2 Criteria — Tasks 74–75</div>}
        {step === 2 && <div className="panel p-6 text-sm text-ink-2">Step 3 Review — Task 76</div>}
        {step === 3 && <div className="panel p-6 text-sm text-ink-2">Step 4 Mission & sim — Task 77</div>}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <button onClick={onExitToDashboard} className="mono text-[11px] uppercase text-ink-2 hover:text-ink-0">
          ← back to dashboard
        </button>
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
