import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { DbCandidate, CriterionEntry } from "@/db/schema";
import { getCandidateWithEvidence } from "@/db/repository";

export type WizardStep = 0 | 1 | 2 | 3;
export const STEP_LABELS: Record<WizardStep, string> = {
  0: "Identity",
  1: "Criteria",
  2: "Review",
  3: "Mission & sim",
};

type WizardState = {
  candidate: DbCandidate | null;
  criterionEntries: CriterionEntry[];
  step: WizardStep;
  highestCompletedStep: -1 | WizardStep;
};

type WizardContextValue = WizardState & {
  setStep: (s: WizardStep) => void;
  markStepCompleted: (s: WizardStep) => void;
  reloadFromDb: () => Promise<void>;
};

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({
  candidateId,
  initialStep,
  children,
}: {
  candidateId: string;
  initialStep: WizardStep;
  children: ReactNode;
}) {
  const [state, setState] = useState<WizardState>({
    candidate: null,
    criterionEntries: [],
    step: initialStep,
    highestCompletedStep: -1,
  });

  const reloadFromDb = useCallback(async () => {
    const bundle = await getCandidateWithEvidence(candidateId);
    setState((s) => ({ ...s, candidate: bundle.candidate, criterionEntries: bundle.criterionEntries }));
  }, [candidateId]);

  useEffect(() => {
    reloadFromDb();
  }, [reloadFromDb]);

  const setStep = useCallback((s: WizardStep) => {
    setState((cur) => ({ ...cur, step: s }));
  }, []);

  const markStepCompleted = useCallback((s: WizardStep) => {
    setState((cur) => ({
      ...cur,
      highestCompletedStep: Math.max(cur.highestCompletedStep, s) as WizardStep,
    }));
  }, []);

  return (
    <WizardContext.Provider value={{ ...state, setStep, markStepCompleted, reloadFromDb }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard outside WizardProvider");
  return ctx;
}
