import { SelectronError } from "@/engine/errors";

type Rng = () => number;

/**
 * Severity-branching Bernoulli per IMM spec §3.3 (Antonsen 2022 / Myers 2018
 * §2.1.2). Returns 1 = worst-case, 0 = best-case. `q` is the per-condition
 * worst-case probability (`worst_case_prob_q` in priors.json), elicited from
 * the I&C evidence corpus.
 */
export function sampleSeverity(rng: Rng, q: number): 0 | 1 {
  if (!Number.isFinite(q) || q < 0 || q > 1) {
    throw new SelectronError(
      "E_BAD_PRIOR",
      `worst_case_prob_q must be in [0,1], got ${q}`,
      { q },
    );
  }
  return rng() < q ? 1 : 0;
}
