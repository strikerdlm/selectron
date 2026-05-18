export type SelectronErrorCode =
  | "E_BAD_SCORE"
  | "E_BAD_WEIGHT"
  | "E_NO_CRITERIA"
  | "E_NO_CANDIDATES"
  | "E_SAMPLER_DIVERGED";

export class SelectronError extends Error {
  readonly code: SelectronErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: SelectronErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "SelectronError";
    this.code = code;
    this.details = details;
  }
}
