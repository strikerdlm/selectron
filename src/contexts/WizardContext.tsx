import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { DbCandidate, CriterionEntry } from "@/db/schema";
import { getCandidateWithEvidence, updateCandidate, upsertCriterionEntry } from "@/db/repository";
import { notify } from "@/ui/components/Toast";

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
  enqueueCandidatePatch: (patch: Partial<DbCandidate>) => void;
  enqueueCriterionPatch: (criterionId: string, patch: Partial<CriterionEntry>) => void;
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

  const [pendingPatches, setPendingPatches] = useState<{
    candidate?: Partial<DbCandidate>;
    criterionEntries: Record<string, Partial<CriterionEntry>>;
  }>({ criterionEntries: {} });

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

  const enqueueCandidatePatch = useCallback((patch: Partial<DbCandidate>) => {
    setPendingPatches((cur) => ({ ...cur, candidate: { ...cur.candidate, ...patch } }));
  }, []);

  const enqueueCriterionPatch = useCallback(
    (criterionId: string, patch: Partial<CriterionEntry>) => {
      setPendingPatches((cur) => ({
        ...cur,
        criterionEntries: {
          ...cur.criterionEntries,
          [criterionId]: { ...cur.criterionEntries[criterionId], ...patch },
        },
      }));
    },
    [],
  );

  // flushRef holds the latest flush closure so the cleanup can reach it even
  // after the effect has re-run with a newer pendingPatches snapshot.
  const flushRef = useRef<(() => Promise<void>) | null>(null);

  // 300 ms debounced auto-save: fires whenever pendingPatches gains content,
  // resets timer on each additional change within the window.
  useEffect(() => {
    if (!pendingPatches.candidate && Object.keys(pendingPatches.criterionEntries).length === 0) return;

    const flush = async () => {
      try {
        if (pendingPatches.candidate && candidateId) {
          await updateCandidate(candidateId, pendingPatches.candidate);
        }
        for (const [criterionId, patch] of Object.entries(pendingPatches.criterionEntries)) {
          // Use existing rawValue so a partial patch (e.g. notes-only) does not
          // overwrite a previously-saved numeric value with 0.
          const existing = state.criterionEntries.find((e) => e.criterionId === criterionId);
          await upsertCriterionEntry({
            candidateId,
            criterionId,
            rawValue: patch.rawValue ?? existing?.rawValue ?? 0,
            ...patch,
          });
        }
        setPendingPatches({ criterionEntries: {} });
        await reloadFromDb();
      } catch (err) {
        notify(`autosave failed: ${(err as Error).message}`, "error");
      }
    };
    flushRef.current = flush;

    const handle = setTimeout(flush, 300);
    // Cleanup on dep change is ONLY clearTimeout — do NOT flush here, otherwise
    // each rapid edit triggers an immediate concurrent flush alongside the
    // scheduled 300 ms one (defeats the debounce + floods the IDB write path).
    // True-unmount flush lives in the separate effect below.
    return () => clearTimeout(handle);
    // state.criterionEntries intentionally captured in closure; pendingPatches
    // drives the dep array so the effect re-runs on each enqueue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPatches, candidateId, reloadFromDb]);

  // Separate effect with empty deps so its cleanup runs ONLY on unmount, not on
  // every pendingPatches change. Best-effort synchronous flush of whatever
  // `flushRef.current` last held — e.g., when "Mark ready" → navigate to Sim
  // view mid-debounce, the pending status patch is not silently dropped.
  useEffect(() => {
    return () => {
      void flushRef.current?.();
    };
  }, []);

  return (
    <WizardContext.Provider
      value={{
        ...state,
        setStep,
        markStepCompleted,
        reloadFromDb,
        enqueueCandidatePatch,
        enqueueCriterionPatch,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard outside WizardProvider");
  return ctx;
}
