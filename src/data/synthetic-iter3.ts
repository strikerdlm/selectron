// Iter-3 SCAFFOLD — synthetic placeholder priors + crew helper for the
// Mission-risk UI tab. Replace SYNTHETIC_PRIORS with the real priors.json
// emitted by the Phase 3A/3B PyMC fit before claiming Iter-3 production
// readiness. Replace synthesizeCrew with the Iter-2 multi-candidate list
// when that lands.
//
// Shape mirrors tests/risk/simulate.test.ts::syntheticPriors so the App.tsx
// wired simulator behaves identically to the unit tests.

import type { Candidate } from "@/types";
import type { PriorsJson } from "@/risk/priorsSchema";
import { ANALOG_CONDITIONS } from "@/risk/conditions";
import { ANALOG_MISSIONS } from "@/data/analog-missions";
import { makeRng } from "@/engine/prng";
import conflictTeamPriors from "@/data/conflict-team-priors.json";

const PRIORS_SEED = 0xfeed;
const SAMPLES_PER_MISSION = 1000;

// Every mission type present in the catalog. Derived (not hardcoded) so a new
// mission type can never be silently dropped — that gap left "thor" (short-22d)
// with no priors → zero events → CHI = 100 % (a spurious "perfect, GO" verdict).
const MISSION_TYPES = Array.from(new Set(ANALOG_MISSIONS.map((m) => m.type)));

const SD_LOG = 0.3;

// Per-condition literature-derived mean log-lambda for the Iter-3 v2 expansion
// (conditions 13–30). Values in events/person-day (rate) or p/EVA (event).
// Rates are conservative best estimates anchored to the analog-mission evidence
// corpus (Pagel & Choukèr 2016, Basner 2014, Ponomarev 2021, etc.).
// Conditions not listed here fall back to the flat kind-based default below.
const CONDITION_MEAN_LOG: Readonly<Record<string, number>> = {
  // ── Musculoskeletal ──────────────────────────────────────────────────────
  "low-back-pain":                    Math.log(0.00041), // ~0.15/py sedentary confinement
  "deconditioning-cardiorespiratory": Math.log(0.00082), // ~0.30/py; Abeln 2022 10–15% VO₂max loss
  // ── Physiologic ─────────────────────────────────────────────────────────
  "upper-respiratory-infection":      Math.log(0.00027), // ~0.10/py (near-zero in deep isolation)
  "gastrointestinal-complaint":       Math.log(0.00068), // ~0.25/py; dietary-change constipation/nausea
  "weight-loss-significant":          Math.log(0.00027), // ~0.10/py detection threshold
  "dental-problem":                   Math.log(0.00027), // ~0.10/py; Robertson 2020 analog rate
  "skin-complaint":                   Math.log(0.00041), // ~0.15/py; hygiene/humidity-limited
  "headache-tension":                 Math.log(0.00137), // ~0.50/py; Basner 2014 somatic complaints
  "thermal-regulatory-challenge":     Math.log(0.00014), // ~0.05/py; polar-specific exposure
  // ── Psychiatric ─────────────────────────────────────────────────────────
  "third-quarter-phenomenon":         Math.log(0.00192), // ~0.70/py; majority of long missions
  "monotony-boredom":                 Math.log(0.00027), // ~0.10/py clinically significant
  "sleep-aid-reliance":               Math.log(0.00082), // ~0.30/py initiation; 45–50% ISS prevalence
  "seasonal-affective-response":      Math.log(0.00027), // ~0.10/py; Palinkas 2004 Antarctic winter-over
  "autonomy-frustration":             Math.log(0.00027), // ~0.10/py episodic; Sandal 2018
  // ── Performance ─────────────────────────────────────────────────────────
  "sustained-cognitive-decrement":    Math.log(0.00041), // ~0.15/py; 1/6 crew Mars-500
  "operational-error":                Math.log(0.05),    // 5% per EVA; Luger 2014 MARS2013
  // ── Team ────────────────────────────────────────────────────────────────
  "leadership-challenge":             Math.log(0.00055), // ~0.20/py crew-level rate; superseded by team block λ in the crew pass
  "role-ambiguity-conflict":          Math.log(0.00041), // ~0.15/py; McMenamin 2020
};

const meanLogFor = (id: string, kind: string): number =>
  CONDITION_MEAN_LOG[id] ?? (kind === "event" ? Math.log(0.05) : Math.log(0.0005));

function makeLogLambdaSamples(meanLog: number, sdLog: number, seed: number): number[] {
  const rng = makeRng(seed);
  const out: number[] = new Array(SAMPLES_PER_MISSION);
  for (let i = 0; i < SAMPLES_PER_MISSION; i++) {
    const u1 = Math.max(rng(), 1e-12);
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    out[i] = meanLog + sdLog * z;
  }
  return out;
}

function makeMissionEntry(meanLog: number, seed: number) {
  const samples = makeLogLambdaSamples(meanLog, SD_LOG, seed);
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance = samples.reduce((a, b) => a + (b - mean) * (b - mean), 0) / samples.length;
  return { log_lambda_samples: samples, mean_log_lambda: mean, sd_log_lambda: Math.sqrt(variance) };
}

// Synthetic-structural defaults for the conflict/team Bayesian layer (spec
// docs/superpowers/specs/2026-06-06-selectron-conflict-team-bayesian-design.md §5–§7).
// The PyMC-fittable params (pi_unstable_base/samples, lambda_base_samples,
// crew_frailty_phi_samples) get OVERWRITTEN by conflict-team-priors.json in a
// later task; these literature-anchored defaults keep the engine fully
// functional without the Python service.
function buildTeamBlock(): NonNullable<PriorsJson["team"]> {
  const teamIds = ANALOG_CONDITIONS.filter((c) => c.family === "team").map((c) => c.id);
  // Crew-level per-day base rate for a reference 6-person crew, anchored to
  // Bell 2019 ("all teams report ≥1 conflict by 40% of mission / 90 d"):
  //   1 − exp(−λ·0.4·90) ≈ 0.97  →  λ ≈ 0.097/day.
  const lambdaBase = 0.097;
  const lambda_base_samples: Record<string, number[]> = {};
  teamIds.forEach((id, i) => {
    lambda_base_samples[id] = makeLogLambdaSamples(Math.log(lambdaBase), 0.25, (PRIORS_SEED ^ 0x7a3b) + i)
      .map((x) => Math.exp(x));
  });

  const fitted = (conflictTeamPriors as { team?: Partial<NonNullable<PriorsJson["team"]>> }).team;

  return {
    crew_frailty_phi_samples: fitted?.crew_frailty_phi_samples ?? [2, 2.5, 3, 3.5, 4],
    member_frailty_phi: 4,
    pi_unstable_base: 0.658, // FIT: Tu 2024 latent-class split 133/202 crews unstable (conflict_fit.py)
    pi_unstable_samples: fitted?.pi_unstable_samples,
    // alpha_fit < 0 is the TIME×SELECTION BRIDGE (peer review 2026-06-07 A3):
    // a higher-fit crew (mean behavioral.teamwork z↑) lowers P(unstable class),
    // so a selected/trained crew gets the flat trajectory while a random crew gets
    // the back-loaded rising one (see src/risk/crew-state.ts drawTrialLatentState).
    // OPERATOR-SUPPLIED tuning parameter — the latent-class SPLIT is Tu-2024-fit,
    // but the fit→instability SLOPE is not separately identified; sensitivity-swept.
    alpha_fit: -0.5,
    sigma_log_beta: 0.3,     // ≈ ±35% β uncertainty (V&V sensitivity band)
    // temporal_a / temporal_p shape the unstable-class back-loaded ramp
    // g(u)=1+a·u^p. OPERATOR-SUPPLIED tuning parameters, NOT fit (conflict_fit.py
    // docstring: "temporal_a/p ... filled in by the TS layer, not fit here"). λ_base
    // was derived from Bell 2019 under a CONSTANT-hazard inversion, so the
    // super-linearity (back-loading) is an assumption, not evidence. Reported as a
    // modeled assumption and sensitivity-swept — never presented as evidence-based
    // (peer review 2026-06-07 §3.5 / plan §4 C4).
    temporal_a: 2,
    temporal_p: 2,           // back-loaded ramp (assumed shape; see note above)
    beta_het: 0.3,
    beta_weak: 0.4,
    dyad_ref_n: 6,
    lambda_base_samples: fitted?.lambda_base_samples
      ? { ...lambda_base_samples, ...fitted.lambda_base_samples }
      : lambda_base_samples,
  };
}

function buildSyntheticPriors(): PriorsJson {
  const conditions: PriorsJson["conditions"] = {};
  let salt = PRIORS_SEED;
  for (const c of ANALOG_CONDITIONS) {
    const meanLog = meanLogFor(c.id, c.kind);
    // ONE posterior per condition, SHARED across all mission types. The Iter-3
    // scaffold has no evidence for per-environment rate differences, so drawing
    // a fresh per-type sample only injected spurious noise into the mission
    // comparison (e.g. a 45-day and 90-day HI-SEAS mission — same type, same EVA
    // count — disagreeing for no physical reason). With a shared posterior the
    // comparison varies only with real mission parameters: duration (Poisson
    // scaling), crew size, and EVA count. (Diego 2026-05-29.)
    const entry = makeMissionEntry(meanLog, ++salt);
    const missions: PriorsJson["conditions"][string]["missions"] = {};
    for (const m of MISSION_TYPES) missions[m] = entry;
    conditions[c.id] = {
      missions,
      vulnerability_beta:
        c.vulnerabilityCriteria.length > 0
          ? Object.fromEntries(
              c.vulnerabilityCriteria.map((cid) => [
                cid,
                // Family-specific β against z-scored higher-is-better criteria.
                // Negative β: HIGH-quality candidate (z>0) → β·z<0 → exp<1 → λ↓.
                // Magnitudes calibrated so worst-vs-best (4 SD spread, ±2 z units)
                // produces a meaningful 2-4× incidence multiplier spread.
                // Condition families present in ANALOG_CONDITIONS v2:
                //   psychiatric, team, physiologic, musculoskeletal, performance.
                // Future families (Iter-2+ ConditionFamily expansion) are cast via
                // string comparison to avoid TS2367 narrowing errors while keeping
                // forward-compatibility branches explicit.
                (c.family as string) === "psychiatric"      ? -0.4 :
                (c.family as string) === "behavioral"       ? -0.3 :
                (c.family as string) === "infectious"       ? -0.25 :
                (c.family as string) === "musculoskeletal"  ? -0.2 :
                (c.family as string) === "neurologic"       ? -0.3 :
                (c.family as string) === "GI"               ? -0.15 :
                (c.family as string) === "cardiovascular"   ? -0.25 :
                (c.family as string) === "respiratory"      ? -0.2 :
                (c.family as string) === "renal"            ? -0.15 :
                                                               -0.2,    // default (team, physiologic, performance)
              ]),
            )
          : {},
      worst_case_prob_q: 0.25,
      treated_lost_days_mean: 1.0,
      untreated_lost_days_mean: 4.0,
    };
  }
  return {
    model_version: "synthetic-iter3-ui-scaffold",
    fitted_at: "2026-05-19T00:00:00Z",
    conditions,
    team: buildTeamBlock(),
  };
}

export const SYNTHETIC_PRIORS: PriorsJson = buildSyntheticPriors();

export function synthesizeCrew(template: Candidate, size: number): Candidate[] {
  const crew: Candidate[] = new Array(size);
  for (let i = 0; i < size; i++) {
    crew[i] = {
      id: `${template.id}-clone-${i}`,
      alias: `${template.alias} · clone ${i + 1}`,
      scores: { ...template.scores },
    };
  }
  return crew;
}
