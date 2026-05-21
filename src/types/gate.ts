export type GateVerdict = "qualified" | "disqualified";

export type GateResult = {
  verdict: GateVerdict;
  failedGates: string[];
  evaluated: string[];
  notes?: string;
};
