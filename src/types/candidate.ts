export type Candidate = {
  id: string;
  alias: string;
  scores: Record<string, number>;
  metadata?: Record<string, unknown>;
};
