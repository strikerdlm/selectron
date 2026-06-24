// Diego scope expansion 2026-05-19: step-by-step calculation viewer.
// Renders the math behind Stage A (uncertain-weight MCDA) or Stage B (IMM forward MC)
// as a vertical chain of steps. Each step has:
//   - title + scientific notation
//   - the concrete numbers from THIS candidate's data
//   - an arrow connector → "in plain English" lay explanation
//   - a citation footer linking the step to a source
//
// Diego's intent: give priority to making the calculation visible + educational.
// "Like /frontend-design" — cool, dense, scientific aesthetic. Lay text always
// visible (no collapse-by-default), connected via a downward arrow glyph so the
// reader's eye travels from equation → human meaning naturally.
//
// 2026-05-29 (Diego): in interactive views the whole trace is COLLAPSED by
// default — the header acts as a toggle and the steps appear only when the user
// clicks to read the explanation. Paper figures (e.g. F4) pass collapsible={false}
// so they always render the full expanded chain.

import { useState, type ReactNode } from "react";
import type { AccessTier, Criterion, ScoreDistribution } from "@/types";
import { TIER_LABEL } from "@/types";
import type { RiskPosterior, AnalogMission, Condition } from "@/types/risk";
import { normalizeScore } from "@/engine";

type Citation = { id: string; label: string };

type TraceStep = {
  n: number;
  title: string;
  equation: ReactNode;
  concrete: ReactNode;
  lay: string;
  citation: Citation;
};

function TraceStepCard({ step, last }: { step: TraceStep; last: boolean }) {
  return (
    <div className="relative">
      <div className="panel p-5">
        {/* HEADER */}
        <div className="flex items-baseline gap-3 mb-4">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-full
              border border-signal text-signal mono text-[11px] shrink-0"
          >
            {step.n}
          </span>
          <h4 className="display text-[16px] text-ink-0 leading-tight">{step.title}</h4>
        </div>

        {/* EQUATION — scientific notation, monospace */}
        <div
          className="mono text-[13px] text-ink-0 bg-bg-2 border border-line/60
            rounded-md px-4 py-3 mb-3 tabular-nums overflow-x-auto"
        >
          {step.equation}
        </div>

        {/* CONCRETE — actual numbers from this candidate */}
        <div className="mono text-[11px] text-signal/90 mb-4 tabular-nums">
          <span className="text-ink-3 mr-2 uppercase tracking-cap">applied here</span>
          {step.concrete}
        </div>

        {/* ARROW + LAY */}
        <div className="flex items-start gap-3 border-l-2 border-signal/40 pl-3 py-1">
          <span
            className="mono text-[10px] uppercase tracking-cap text-signal shrink-0
              flex items-center gap-1.5 pt-0.5"
            aria-hidden
          >
            <span className="text-signal text-[14px] leading-none">↓</span>
            Explanation
          </span>
        </div>
        <p className="text-[14px] text-ink-1 leading-relaxed pl-3 mt-1">{step.lay}</p>

        {/* CITATION */}
        <div className="mt-4 pt-3 border-t border-line/40 mono text-[10px] text-ink-3">
          <span className="uppercase tracking-cap mr-2">source</span>
          <span className="text-ink-2">{step.citation.label}</span>
          <span className="ml-2 text-ink-3">[{step.citation.id}]</span>
        </div>
      </div>

      {/* CONNECTOR between cards */}
      {!last && (
        <div className="flex justify-center py-2" aria-hidden>
          <div className="w-px h-6 bg-gradient-to-b from-signal/60 to-line" />
        </div>
      )}
    </div>
  );
}

// ─── MCDA mode ─────────────────────────────────────────────────────────────

const sub = (s: string) => (
  <sub className="text-[9px]" style={{ verticalAlign: "sub" }}>
    {s}
  </sub>
);

const sup = (s: string) => (
  <sup className="text-[9px]" style={{ verticalAlign: "super" }}>
    {s}
  </sup>
);

const fmt = (x: number, d = 2) => x.toFixed(d);

function mcdaSteps(args: {
  scoreDistribution: ScoreDistribution;
  criteria: readonly Criterion[];
  scores: Record<string, number>;
  alias: string;
  seed: number;
  accessTier: AccessTier;
}): TraceStep[] {
  const { scoreDistribution, criteria, scores } = args;
  const K = criteria.length;

  // For step 1 demo: pick the first criterion with a non-null score
  const demoC =
    criteria.find((c) => scores[c.id] !== undefined) ?? criteria[0];
  const demoRaw = scores[demoC.id] ?? demoC.scale.min;
  const demoZ = normalizeScore(demoRaw, demoC.scale, demoC.higherIsBetter);
  const demoCInstrument =
    demoC.tierInstruments?.[args.accessTier]?.instrument ?? demoC.instrument;

  // For step 3 demo: compute a weighted sum on the first sampled score draw.
  const samples = scoreDistribution.samples;
  const firstDraw = samples[0] ?? scoreDistribution.mean;

  return [
    {
      n: 1,
      title: "Normalize each raw test score to a unitless 0-to-1 value",
      equation: (
        <span>
          z{sub("k")} = (x{sub("k")} − min{sub("k")}) / (max{sub("k")} − min
          {sub("k")})
        </span>
      ),
      concrete: (
        <span>
          {demoC.label} (instrument: <span className="text-ink-1">{demoCInstrument}</span>):
          x = {fmt(demoRaw, 1)} on [{demoC.scale.min}, {demoC.scale.max}] → z = {fmt(demoZ, 3)}
          {demoC.higherIsBetter === false && (
            <span className="text-ink-3 ml-2">(flipped: lower raw → higher z)</span>
          )}
        </span>
      ),
      lay:
        "Each test reports its score on its own scale (NEO-PI-R uses T-scores 0–100; VO₂max uses mL/kg/min, etc.). Before we can combine them, we have to put every test on the same ruler. We use an affine map that sets the lowest possible score to 0 and the highest to 1. After this step, every criterion lives in the same [0, 1] interval and can be added together.",
      citation: {
        id: "Iter-1 spec §3.2",
        label: "Selectron Iter-1 design — score normalization",
      },
    },
    {
      n: 2,
      title: "Draw a criterion-weight vector from the uncertain-weight prior",
      equation: (
        <span>
          w ~ Dirichlet(α{sub("1")}, …, α{sub("K")}), α{sub("k")} = 1 for all k
        </span>
      ),
      concrete: (
        <span>
          K = {K} criteria · α = (1, …, 1) → symmetric prior · mean weight ={" "}
          {fmt(1 / K, 3)} per criterion
        </span>
      ),
      lay:
        "The current app does not learn criterion weights from expert or outcome data. It samples plausible positive weight vectors that sum to 1 from an explicit Dirichlet prior. Using α = (1, …, 1) says 'no prior preference' across criteria.",
      citation: {
        id: "A6 methodology precedents",
        label: "Uncertain-weight MCDA — Dirichlet weight prior",
      },
    },
    {
      n: 3,
      title: "Compute the weighted total score for this draw",
      equation: (
        <span>
          S{sup("(s)")} = Σ{sub("k=1")}
          {sup("K")} w{sub("k")}
          {sup("(s)")} · z{sub("k")}
        </span>
      ),
      concrete: (
        <span>
          One Monte-Carlo draw out of {scoreDistribution.samples.length.toLocaleString()}:
          S = {fmt(firstDraw, 3)} (this is sample #1 of {scoreDistribution.samples.length})
        </span>
      ),
      lay:
        "For each draw of the weight vector, we multiply each criterion's z-score by its weight and add them up. The result is one possible total score for the candidate. Different weight draws give different totals; that spread is an assumed-priority sensitivity distribution, not a learned posterior.",
      citation: {
        id: "Iter-1 spec §3.3",
        label: "Selectron MCDA scoring engine",
      },
    },
    {
      n: 4,
      title: "Repeat thousands of draws → induced distribution over total score",
      equation: (
        <span>
          {`{ S`}
          {sup("(1)")}, S{sup("(2)")}, …, S{sup("(N)")}
          {` }, with N = ${scoreDistribution.samples.length.toLocaleString()}`}
        </span>
      ),
      concrete: (
        <span>
          MCDA mean μ = {fmt(scoreDistribution.mean, 3)} · interval₉₀ = [
          {fmt(scoreDistribution.ci90[0], 3)}, {fmt(scoreDistribution.ci90[1], 3)}] · interval₉₅ = [
          {fmt(scoreDistribution.ci95[0], 3)}, {fmt(scoreDistribution.ci95[1], 3)}] · draws ={" "}
          {scoreDistribution.ess.toFixed(0)}
        </span>
      ),
      lay:
        "By drawing many weight vectors and computing the total score each time, we build a histogram of scores induced by the assumed weight uncertainty. The width of that histogram tells us how sensitive the score is to criterion priorities. It is not a learned posterior over candidate suitability.",
      citation: {
        id: "Monte Carlo score propagation — [G12] §4",
        label: "Uncertain-weight MCDA summary statistics",
      },
    },
  ];
}

/**
 * Collapsible shell shared by both trace views. When `collapsible` (the default
 * for interactive views) the whole step chain is hidden until the user clicks
 * the header. Paper figures pass `collapsible={false}` to always render expanded.
 */
function TraceShell({
  collapsible,
  title,
  badges,
  intro,
  steps,
}: {
  collapsible: boolean;
  title: ReactNode;
  badges: ReactNode;
  intro: ReactNode;
  steps: TraceStep[];
}) {
  const [open, setOpen] = useState(false);
  const expanded = collapsible ? open : true;

  const headerInner = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="display text-[18px] text-ink-0 flex items-center gap-2">
          {collapsible && (
            <span className="mono text-signal text-[14px]" aria-hidden>{expanded ? "▾" : "▸"}</span>
          )}
          {title}
        </h3>
        <div className="flex items-center gap-2">{badges}</div>
      </div>
      <p className="text-[14px] text-ink-1 mt-2 leading-relaxed">
        {expanded ? (
          intro
        ) : (
          <span className="text-ink-2">Click to read the step-by-step explanation of how this number was computed.</span>
        )}
      </p>
    </>
  );

  return (
    <div className="space-y-0">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={expanded}
          className="w-full text-left panel p-4 mb-3 border-signal/40 hover:border-signal/70 transition-colors cursor-pointer"
        >
          {headerInner}
        </button>
      ) : (
        <header className="panel p-4 mb-3 border-signal/40">{headerInner}</header>
      )}

      {expanded &&
        steps.map((s, i) => (
          <TraceStepCard key={s.n} step={s} last={i === steps.length - 1} />
        ))}
    </div>
  );
}

export function MCDACalculationTrace(props: {
  scoreDistribution?: ScoreDistribution;
  /** @deprecated Use scoreDistribution. */
  posterior?: ScoreDistribution;
  criteria: readonly Criterion[];
  scores: Record<string, number>;
  alias: string;
  seed: number;
  accessTier: AccessTier; // scope-expansion-3
  /** Interactive views collapse by default; paper figures pass false. */
  collapsible?: boolean;
}) {
  const scoreDistribution = props.scoreDistribution ?? props.posterior;
  if (!scoreDistribution) {
    throw new Error("MCDACalculationTrace requires scoreDistribution");
  }
  const steps = mcdaSteps({
    scoreDistribution,
    criteria: props.criteria,
    scores: props.scores,
    alias: props.alias,
    seed: props.seed,
    accessTier: props.accessTier,
  });
  return (
    <TraceShell
      collapsible={props.collapsible ?? true}
      title={<>How we scored <span className="text-signal">{props.alias}</span></>}
      badges={
        <>
          <span className="mono text-[10px] uppercase tracking-cap text-signal border border-signal/40 rounded px-2 py-0.5">
            tier · {TIER_LABEL[props.accessTier]}
          </span>
          <span className="mono text-[10px] uppercase tracking-cap text-ink-2">
            stage a · uncertain-weight mcda
          </span>
        </>
      }
      intro={
        <>
          The total-score distribution on the right is the output of these four steps. Each
          step shows the math, the concrete numbers, and a plain-English explanation
          below the equation.
        </>
      }
      steps={steps}
    />
  );
}

// ─── IMM mode ───────────────────────────────────────────────────────────────

function immSteps(args: {
  posterior: RiskPosterior;
  mission: AnalogMission;
  conditions: readonly Condition[];
  trials: number;
  seed: number;
  chiStar: number;
  priorsVersion: string;
}): TraceStep[] {
  const { posterior, mission, conditions, trials, chiStar, priorsVersion } = args;

  // Pick the top-contributing condition for a worked example
  const conditionsWithMean = conditions
    .map((c) => ({
      c,
      mean: posterior.perConditionQTL[c.id]?.mean ?? 0,
    }))
    .sort((a, b) => b.mean - a.mean);
  const top = conditionsWithMean[0]?.c;
  const topMean = conditionsWithMean[0]?.mean ?? 0;
  const totalQtl = conditionsWithMean.reduce((s, x) => s + x.mean, 0);

  const availDays = mission.durationDays * mission.crewSize;

  return [
    {
      n: 1,
      title: "Look up each condition's base incidence rate from the prior",
      equation: (
        <span>
          log λ{sub("k")} ~ stored fitted parameter distribution{"  "}(model {priorsVersion})
        </span>
      ),
      concrete: (
        <span>
          {conditions.length} conditions · mission {mission.id} · priors version{" "}
          {priorsVersion}
        </span>
      ),
      lay:
        "Before any simulation runs, we already have a probability distribution over each condition's base rate (events per crew member per day). This stored prior distribution comes from the fitting pipeline and is saved in priors.json. Each Monte-Carlo trial draws a new rate from this distribution, so the simulation reflects parameter uncertainty under the configured model.",
      citation: {
        id: "Iter-3 spec §3.6 / [M18 §2.1.1]",
        label: "Stored Lognormal-Poisson parameter distribution",
      },
    },
    {
      n: 2,
      title: "Adjust the rate per crew member using their vulnerability score",
      equation: (
        <span>
          λ{sub("k,i")} = λ{sub("k")}
          {sup("base")} · exp(β{sub("k")}
          {sup("⊤")} · z{sub("i")})
        </span>
      ),
      concrete: (
        <span>
          crew size {mission.crewSize} · scenario β vector from operator defaults ·
          z = normalized Stage A scores when coupling is explicitly enabled
        </span>
      ),
      lay:
        "Trait-to-incidence coupling is an explicit scenario-analysis lever, not the default scientific mode. When enabled, the app multiplies the base rate by exp(β·z), where β is an operator-supplied stress-test coefficient and z is the crew member's normalized Stage A score. The accepted evidence ledger does not currently calibrate these β values against analog outcome data.",
      citation: {
        id: "Cox 1972 / [M18 §2.1.1 extension]",
        label: "Log-linear vulnerability multiplier",
      },
    },
    {
      n: 3,
      title: "Sample how many events occur during the mission",
      equation: (
        <span>
          rate conditions: N{sub("k")} ~ Poisson(λ{sub("k,i")} · t · c){"   "}
          event conditions: N{sub("k")} ~ Binomial(n, p)
        </span>
      ),
      concrete: top ? (
        <span>
          example — <span className="text-ink-0">{top.label}</span> ({top.kind}):{" "}
          mean QTL contribution = {fmt(topMean, 2)} crew-days
        </span>
      ) : (
        <span>(no condition data yet)</span>
      ),
      lay:
        "For 'rate' conditions like insomnia or musculoskeletal injury, we draw the event count from a Poisson distribution — that's the standard distribution for things that happen at a steady rate over time. For 'event' conditions tied to specific operations (EVAs, mission milestones), we use a Binomial draw instead. Each trial gets fresh random numbers, so the simulation captures the natural variability of bad luck.",
      citation: {
        id: "[M18 §2.1.2]",
        label: "Poisson process + Binomial event-trigger",
      },
    },
    {
      n: 4,
      title: "For each event, decide severity + treatment outcome",
      equation: (
        <span>
          severity ~ Bernoulli(q{sub("k")}){"   "}
          lost-days = (1 − τ) · d{sub("untreated")} + τ · d{sub("treated")}
        </span>
      ),
      concrete: (
        <span>
          worst-case probability q is per-condition (audit); τ ∈ [0, 1] is treatment
          availability from mission countermeasures
        </span>
      ),
      lay:
        "Most events are mild and self-resolve quickly; a small fraction become serious. We draw a Bernoulli coin-flip with probability q to decide which. Then we compute how many crew-days are lost: if treatment is available (τ close to 1), the event is short; if not (τ close to 0), it drags on much longer. The linear interpolation reflects 'partial credit' — half-available treatment shortens the event halfway.",
      citation: {
        id: "[A22 §3.3] / [M18 §2.1.2]",
        label: "Severity branching + treatment partial credit",
      },
    },
    {
      n: 5,
      title: "Sum lost days across conditions → QTL, then convert to Crew Health Index",
      equation: (
        <span>
          QTL = Σ{sub("k")} lost-days{sub("k")}
          {"     "}CHI = 1 − QTL / (t · c)
        </span>
      ),
      concrete: (
        <span>
          available person-days = {mission.durationDays} × {mission.crewSize} ={" "}
          {availDays.toLocaleString()} · total QTL μ = {fmt(totalQtl, 2)} crew-days · CHI μ ={" "}
          {fmt(100 * posterior.chi.mean, 1)}%
        </span>
      ),
      lay:
        "We add up all the lost crew-days across all conditions to get QTL — Quality Time Lost. The Crew Health Index is QTL expressed as a percentage of the mission's available person-days: 100% means a perfectly healthy mission, 90% means 10% of the mission's productive time was lost. CHI is the headline number because it normalizes for mission length and crew size, so a 14-day campaign and a 520-day campaign can be compared on the same scale.",
      citation: {
        id: "[A22 Fig. 1] / [M18 §2.1.2]",
        label: "QTL aggregation + Crew Health Index definition",
      },
    },
    {
      n: 6,
      title: "Repeat thousands of trials → CHI simulation distribution + threshold-failure probability",
      equation: (
        <span>
          run T = {trials.toLocaleString()} independent trials · χ* threshold ={" "}
          {chiStar.toFixed(2)} · pBelow = (1/T) Σ 1[CHI{sub("t")} ≤ χ*]
        </span>
      ),
      concrete: (
        <span>
          CHI μ = {fmt(100 * posterior.chi.mean, 1)}% · CI₉₀ = [
          {fmt(100 * posterior.chi.ci90[0], 1)}%,{" "}
          {fmt(100 * posterior.chi.ci90[1], 1)}%] · pBelowThreshold ={" "}
          {fmt(100 * posterior.pEarlyTermination.mean, 1)}%
        </span>
      ),
      lay:
        "One trial captures one possible mission. We re-run with fresh randomness many thousand times to see the full range of outcomes. The 90% simulation interval is the band that holds 90% of the trials. pBelowThreshold is the fraction of trials where crew health dropped below the configured threshold χ*.",
      citation: {
        id: "Iter-3 spec §3.5 / [G12] convergence",
        label: "Monte Carlo summary + early-termination probability",
      },
    },
  ];
}

export function IMMCalculationTrace(props: {
  posterior: RiskPosterior;
  mission: AnalogMission;
  conditions: readonly Condition[];
  trials: number;
  seed: number;
  chiStar: number;
  priorsVersion: string;
  accessTier: AccessTier; // scope-expansion-3
  /** Interactive views collapse by default; paper figures pass false. */
  collapsible?: boolean;
}) {
  const steps = immSteps(props);
  return (
    <TraceShell
      collapsible={props.collapsible ?? true}
      title={<>How we projected <span className="text-signal">{props.mission.id}</span></>}
      badges={
        <>
          <span className="mono text-[10px] uppercase tracking-cap text-signal border border-signal/40 rounded px-2 py-0.5">
            tier · {TIER_LABEL[props.accessTier]}
          </span>
          <span className="mono text-[10px] uppercase tracking-cap text-ink-2">
            stage b · imm forward monte-carlo
          </span>
        </>
      }
      intro={
        <>
          The Crew Health Index histogram on the right is what comes out of these six
          steps. Each step shows the math, the concrete numbers, and a plain-English
          explanation below the equation. seed = 0x{props.seed.toString(16)}.
        </>
      }
      steps={steps}
    />
  );
}
