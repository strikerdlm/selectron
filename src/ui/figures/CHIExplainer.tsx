// Diego scope-expansion 2026-05-19: educational explainer that lives directly
// below the RiskCard + RiskHistogram (Mission Risk + Crew Health Index) panel.
// Defines CHI, the χ* threshold, the early-termination probability and the
// expected lost-crew-days metric, then renders a plain-English interpretation
// of THIS run's specific numbers. No external dependencies — pure presentation.

import type { RiskPosterior } from "@/types/risk";
import { assessLxC } from "@/risk/lxc";
import { LxCMatrix } from "./LxCMatrix";

type Props = {
  posterior: RiskPosterior;
  chiStar: number;
  missionId: string;
};

const NASA_COLOR_TONE: Record<"green" | "yellow" | "red" | "gray", string> = {
  green: "text-emerald-300",
  yellow: "text-amber-300",
  red: "text-warn",
  gray: "text-ink-2",
};

const NASA_COLOR_BORDER: Record<"green" | "yellow" | "red" | "gray", string> = {
  green: "border-emerald-400/40",
  yellow: "border-amber-400/40",
  red: "border-warn/40",
  gray: "border-ink-2/40",
};

// Per JSC-66705 Rev A §3.2.6, the color informs (but does not dictate) the
// HSRB Risk Disposition. These blurbs paraphrase the document's intent into
// operational guidance a non-NASA reader can act on.
const NASA_COLOR_GUIDANCE: Record<"green" | "yellow" | "red" | "gray", string> = {
  green:
    "GREEN risks are managed within existing standards and resources. Per JSC-66705 §3.2.6, current countermeasures are deemed effective; the HSRB would typically ACCEPT this risk without further mitigation work.",
  yellow:
    "YELLOW risks fall in the 'Requires Mitigation' band. Per JSC-66705 §3.2.6.2, current countermeasures are believed inadequate and the HSRB would commission additional or improved countermeasures, technologies, or standards to improve Risk Posture before flight.",
  red:
    "RED risks admit at least one credible scenario with a very serious consequence/likelihood combination (LxC ≥ 20). Per JSC-66705 §3.2.4, red risks are PRIORITIZED for mitigation over yellow risks; per §3.2.6, the HSRB may still accept a red risk if mitigation resources are unachievable, but acceptance must be explicitly documented and revisited as new evidence emerges.",
  gray:
    "GRAY risks are those the LxC matrix cannot characterize (likelihood or consequence undefined). Per JSC-66705 §3.2.4 final paragraph, gray is used as a placeholder — additional evidence collection is needed before a real color can be assigned.",
};

function severityBucket(chiMean: number, chiStar: number): {
  label: string;
  tone: string;
  blurb: string;
} {
  // Distance below the χ* threshold drives the qualitative judgement.
  // χ ≥ χ* + 0.05 → strong; ≥ χ* → adequate; within 0.05 below → marginal; below → degraded.
  const delta = chiMean - chiStar;
  if (delta >= 0.05) {
    return {
      label: "STRONG",
      tone: "text-emerald-300 border-emerald-400/40",
      blurb:
        "Posterior crew health holds comfortably above the operational floor — the mission profile is well-matched to this crew under the modeled prior.",
    };
  }
  if (delta >= 0) {
    return {
      label: "ADEQUATE",
      tone: "text-signal border-signal/40",
      blurb:
        "Posterior crew health sits at or just above the operational floor. Acceptable, but the margin is thin — small adverse drifts in the prior could push the result into degraded territory.",
    };
  }
  if (delta >= -0.05) {
    return {
      label: "MARGINAL",
      tone: "text-amber-300 border-amber-400/40",
      blurb:
        "Posterior crew health is slightly below the χ* floor. Selection is not categorically refused, but mission planners should consider mitigations (extra training, longer EVAs windows, medical kits) before clearing.",
    };
  }
  return {
    label: "DEGRADED",
    tone: "text-warn border-warn/40",
    blurb:
      "Posterior crew health is clearly below the operational floor. This run flags a mission-profile mismatch — either the candidate's evidence is insufficient or the mission is too demanding for the modeled risk priors.",
  };
}

function pctBucket(p: number): { label: string; tone: string } {
  if (p < 0.05) return { label: "LOW", tone: "text-emerald-300" };
  if (p < 0.15) return { label: "MODERATE", tone: "text-signal" };
  if (p < 0.30) return { label: "ELEVATED", tone: "text-amber-300" };
  return { label: "HIGH", tone: "text-warn" };
}

export function CHIExplainer({ posterior, chiStar, missionId }: Props) {
  const chi = posterior.chi.mean;
  const [chiLo, chiHi] = posterior.chi.ci90;
  const pET = posterior.pEarlyTermination.mean;
  const [pETLo, pETHi] = posterior.pEarlyTermination.ci90;
  const lcd = posterior.expectedLostCrewDays.mean;
  const [lcdLo, lcdHi] = posterior.expectedLostCrewDays.ci90;

  const severity = severityBucket(chi, chiStar);
  const etBucket = pctBucket(pET);
  // NASA HSRB LxC assessment driven by the Monte-Carlo posterior. This is
  // the canonical verdict surface — the chi-gap "severity" above stays as a
  // secondary lay-language layer below.
  const lxc = assessLxC(posterior);
  const nasaTone = NASA_COLOR_TONE[lxc.color];
  const nasaBorder = NASA_COLOR_BORDER[lxc.color];

  return (
    <section className={`panel p-6 border-l-2 ${nasaBorder}`}>
      <header className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <h2 className="display text-lg text-ink-0">
          Reading this result · NASA Risk Posture for the mission
        </h2>
        <span className={`mono text-[10px] uppercase tracking-cap ${nasaTone}`}>
          NASA verdict · {lxc.color.toUpperCase()} · LxC = {lxc.score}
        </span>
      </header>

      {/* ── NASA LxC RISK ASSESSMENT (per JSC-66705 Rev A) ──────────────── */}
      <div className={`mb-6 border ${nasaBorder} rounded-md p-4 bg-bg-1/40`}>
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
          <h3 className="display text-base text-ink-0">
            NASA HSRB Likelihood × Consequence matrix
          </h3>
          <span className="mono text-[10px] uppercase tracking-cap text-ink-3">
            JSC-66705 Rev A · Fig. 4
          </span>
        </div>
        <p className="text-sm text-ink-1 leading-relaxed mb-4">
          NASA's Human System Risk Board scores every Human System Risk on a 5×5
          Likelihood × Consequence matrix and assigns a single color (green /
          yellow / red) that summarises the mission-level disposition. Selectron
          maps this run's Bayesian Monte-Carlo posterior onto that matrix using
          NASA's published quantitative likelihood bands and the In-Mission
          Mission Objectives Impact consequence definitions (the sub-category
          that aligns with our QTL-based fraction-of-mission-time-lost metric;
          JSC-66705 §3.2.4 p. 29 requires picking exactly one sub-category per
          impact category). The matrix below shows where this run lands; the
          priority scores in each cell are verbatim from Figure 4.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(260px,360px)_1fr] gap-5 items-start">
          <LxCMatrix assessment={lxc} />

          <div className="space-y-3 text-sm text-ink-1 leading-relaxed">
            <div>
              <span className="mono text-[10px] uppercase tracking-cap text-ink-3">
                likelihood · L{lxc.likelihood} ({lxc.likelihoodLabel})
              </span>
              <p className="mt-1">
                <span className="mono text-ink-0">
                  P(χ &lt; χ*) = {(lxc.pEarlyTermination * 100).toFixed(2)} %
                </span>{" "}
                — {lxc.likelihoodDefinition}
              </p>
            </div>
            <div>
              <span className="mono text-[10px] uppercase tracking-cap text-ink-3">
                consequence · C{lxc.consequence} ({lxc.consequenceLabel})
              </span>
              <p className="mt-1">
                <span className="mono text-ink-0">
                  fraction crew-days lost = {(lxc.fractionLost * 100).toFixed(1)} %
                </span>{" "}
                — {lxc.consequenceDefinition}
              </p>
            </div>
            <div>
              <span className="mono text-[10px] uppercase tracking-cap text-ink-3">
                LxC score · color
              </span>
              <p className="mt-1">
                <span className="mono text-ink-0">
                  L{lxc.likelihood} × C{lxc.consequence} = priority score {lxc.score}
                </span>{" "}
                · color{" "}
                <span className={`mono uppercase tracking-cap ${nasaTone}`}>
                  {lxc.color}
                </span>{" "}
                (NASA cut-offs: green ≤ 10, yellow 11–19, red ≥ 20).
              </p>
            </div>
            <div className={`border-t ${nasaBorder} pt-3 mt-3`}>
              <span className="mono text-[10px] uppercase tracking-cap text-ink-3">
                HSRB disposition guidance
              </span>
              <p className="mt-1">{NASA_COLOR_GUIDANCE[lxc.color]}</p>
            </div>
          </div>
        </div>

        <p className="mono mt-4 pt-3 border-t border-line/40 text-[10px] text-ink-3 leading-relaxed">
          Likelihood thresholds verbatim from JSC-66705 Rev A Figure 4 p. 28
          "LIKELIHOOD RATING · In-Mission" (P ≤ 0.01 %, 0.01–0.1 %, 0.1–1 %, 1–10 %,
          &gt; 10 %). Consequence categories verbatim from Figure 4 "IN MISSION ·
          Mission Objectives Impact" row. Selectron's quantitative bridge from
          chi-gap to consequence band (1 %, 5 %, 15 %, 30 % crew-days lost) is
          documented in src/risk/lxc-definitions.ts — JSC-66705's consequence
          scale is qualitative; cutoffs here are aligned to the published
          descriptors. Color rule from §3.2.4 p. 27: red ≥ 20, yellow 11–19,
          green ≤ 10. Per-mission LxC chips appear in the Mission Comparison
          panel below.
        </p>
      </div>

      <header className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <h3 className="display text-base text-ink-0">
          Plain-language lay layer · what the underlying CHI numbers mean
        </h3>
        <span className={`mono text-[10px] uppercase tracking-cap ${severity.tone}`}>
          lay verdict · {severity.label}
        </span>
      </header>

      {/* ── DEFINITIONS ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <div className="mono text-[10px] uppercase tracking-cap text-ink-3 mb-1">
            CHI — Crew Health Index
          </div>
          <p className="text-sm text-ink-1 leading-relaxed">
            <span className="mono text-ink-0">χ = 1 − QTL / (t · c)</span> · a unitless number in
            [0, 1] where <strong className="text-ink-0">1.0</strong> means the crew finished the
            mission with no quality-of-life days lost, and <strong className="text-ink-0">0.0</strong>{" "}
            means the entire crew was incapacitated for the entire mission. Anything in
            between scales linearly. This is the NASA Integrated Medical Model's
            single-number readout for mission-level health, computed by the Bayesian
            forward Monte-Carlo over the modeled medical conditions.
          </p>
        </div>
        <div>
          <div className="mono text-[10px] uppercase tracking-cap text-ink-3 mb-1">
            χ* — Operational Floor
          </div>
          <p className="text-sm text-ink-1 leading-relaxed">
            <span className="mono text-ink-0">χ* = {chiStar.toFixed(2)}</span> · the minimum CHI
            this Selectron run is willing to accept. Adjustable on the previous step. NASA
            reference programs use 0.7 as a default; tighter floors (0.8+) raise the bar for
            elite missions, looser floors (0.6) suit lower-risk analog campaigns. The
            posterior probability that <span className="mono">χ &lt; χ*</span> is what we call{" "}
            <em>early-termination risk</em> below.
          </p>
        </div>
      </div>

      {/* ── THIS RUN ────────────────────────────────────────────────────── */}
      <div className="border-t border-line pt-4 mb-4">
        <div className="mono text-[10px] uppercase tracking-cap text-ink-3 mb-3">
          this run · mission · {missionId}
        </div>
        <ul className="space-y-3 text-sm text-ink-1 leading-relaxed">
          <li>
            <span className="mono text-ink-0">χ = {chi.toFixed(3)}</span>{" "}
            <span className="mono text-ink-3">[90 % CI {chiLo.toFixed(3)} – {chiHi.toFixed(3)}]</span>{" "}
            — {severity.blurb}
          </li>
          <li>
            <span className="mono text-ink-0">
              P(χ &lt; χ*) = {(pET * 100).toFixed(1)} %
            </span>{" "}
            <span className="mono text-ink-3">
              [90 % CI {(pETLo * 100).toFixed(1)} – {(pETHi * 100).toFixed(1)} %]
            </span>{" "}
            · <span className={`mono uppercase tracking-cap text-[10px] ${etBucket.tone}`}>
              {etBucket.label}
            </span>{" "}
            — fraction of Monte-Carlo trials in which the crew fell below the operational
            floor at some point in the mission. Interpret as a literal "what fraction of
            possible futures end with the mission being cut short for medical reasons" —
            below 5 % is operationally low, above 30 % is a hard re-think signal.
          </li>
          <li>
            <span className="mono text-ink-0">E[lost crew-days] = {lcd.toFixed(1)} d</span>{" "}
            <span className="mono text-ink-3">[90 % CI {lcdLo.toFixed(1)} – {lcdHi.toFixed(1)} d]</span>{" "}
            — expected total person-days the crew loses to incapacitation, integrated over
            the modeled conditions. A 6-person 30-day mission has 180 crew-days of
            capacity; the ratio of lost days to capacity is the mission-level efficiency
            penalty.
          </li>
        </ul>
      </div>

      {/* ── DECISION HOOK ──────────────────────────────────────────────── */}
      <div className="border-t border-line pt-4">
        <div className="mono text-[10px] uppercase tracking-cap text-ink-3 mb-2">
          what to do with this number
        </div>
        <p className="text-sm text-ink-1 leading-relaxed">
          Selectron is a <em>decision-support</em> tool, not an autonomous selector. The CHI
          and its early-termination probability are inputs to a human review board. A
          STRONG verdict means there is no Bayesian objection to the candidate-mission
          match; a MARGINAL or DEGRADED verdict does not categorically disqualify the
          candidate but obliges the board to document the mitigations that close the
          posterior gap.
        </p>
      </div>
    </section>
  );
}
