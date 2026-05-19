import { STEP_LABELS, type WizardStep, useWizard } from "@/contexts/WizardContext";
import { notify } from "@/ui/components/Toast";

export function StepStrip() {
  const { step, highestCompletedStep, setStep } = useWizard();
  const steps: WizardStep[] = [0, 1, 2, 3];
  return (
    <nav className="border-b border-line/60">
      <div className="mx-auto flex max-w-7xl items-stretch gap-1 px-8">
        {steps.map((s) => {
          const active = step === s;
          const clickable = s <= highestCompletedStep + 1;
          const completed = s <= highestCompletedStep;
          return (
            <button
              key={s}
              aria-disabled={!clickable}
              onClick={() => {
                if (!clickable) {
                  notify("complete the current step first", "error");
                  return;
                }
                setStep(s);
              }}
              className={
                "mono uppercase tracking-cap text-[11px] py-3 px-4 -mb-px border-b-2 transition-colors " +
                (active
                  ? "text-ink-0 border-signal"
                  : clickable
                  ? "text-ink-1 border-transparent hover:text-ink-0"
                  : "text-ink-3 border-transparent cursor-not-allowed")
              }
            >
              <span className="mr-2 text-ink-3">{s + 1}</span>
              {STEP_LABELS[s]}
              {completed && <span className="ml-2 text-signal">✓</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
