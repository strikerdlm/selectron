export type GateVerdict = "clear" | "review-flagged";

export type GateResult = {
  verdict: GateVerdict;
  failedGates: string[];
  evaluated: string[];
  notes?: string;
};
