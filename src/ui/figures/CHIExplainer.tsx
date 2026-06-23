// Diego scope-expansion 2026-05-19: educational explainer that lives directly
// below the RiskCard + RiskHistogram (Mission Risk + Crew Health Index) panel.
// Defines CHI, the χ* threshold, the early-termination probability and the
// expected lost-crew-days metric, then renders a plain-English interpretation
// of THIS run's specific numbers. No external dependencies — pure presentation.

import type { RiskPosterior } from "@/types/risk";
import type { GateResult } from "@/types";
import { assessLxC } from "@/risk/lxc";
import { LxCMatrix } from "./LxCMatrix";

type Props = {
  posterior: RiskPosterior;
  chiStar: number;
  missionId: string;
  /** Optional gate result. Review flags are shown separately from the
   *  non-operational LxC appendix mapping. */
  gate?: GateResult;
};

const LXC_COLOR_TONE: Record<"green" | "yellow" | "red" | "gray", string> = {
  green: "text-emerald-300",
  yellow: "text-amber-300",
  red: "text-warn",
  gray: "text-ink-2",
};

const LXC_COLOR_BORDER: Record<"green" | "yellow" | "red" | "gray", string> = {
  green: "border-emerald-400/40",
  yellow: "border-amber-400/40",
  red: "border-warn/40",
  gray: "border-ink-2/40",
};

// Non-operational interpretation for the appendix LxC mapping. This is not a
// NASA disposition and must not be used as applicant eligibility guidance.
const LXC_COLOR_GUIDANCE: Record<"green" | "yellow" | "red" | "gray", string> = {
  green:
    "GREEN means this experimental mapping falls in the lowest priority band under the configured thresholds. It does not establish that the candidate or crew is operationally cleared.",
  yellow:
    "YELLOW means this experimental mapping falls in an intermediate priority band. It should trigger review of assumptions, mitigations, and uncertainty rather than an automatic decision.",
  red:
    "RED means this experimental mapping falls in the highest priority band. It is a review signal, not a NASA-approved risk posture or a substitute for human governance.",
  gray:
    "GRAY means the mapping cannot characterize likelihood or consequence from the available simulation output.",
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
        "Simulated crew health holds comfortably above the operational floor under the configured assumptions.",
    };
  }
  if (delta >= 0) {
    return {
      label: "ADEQUATE",
      tone: "text-signal border-signal/40",
      blurb:
        "Simulated crew health sits at or just above the operational floor. The margin is thin, so small adverse assumption changes could move the result into degraded territory.",
    };
  }
  if (delta >= -0.05) {
    return {
      label: "MARGINAL",
      tone: "text-amber-300 border-amber-400/40",
      blurb:
        "Simulated crew health is slightly below the χ* floor. Review mitigations and assumptions before treating this scenario as acceptable.",
    };
  }
  return {
    label: "DEGRADED",
    tone: "text-warn border-warn/40",
    blurb:
      "Simulated crew health is clearly below the operational floor. This run flags a mission-profile mismatch or insufficient evidence under the modeled priors.",
  };
}

function pctBucket(p: number): { label: string; tone: string } {
  if (p < 0.05) return { label: "LOW", tone: "text-emerald-300" };
  if (p < 0.15) return { label: "MODERATE", tone: "text-signal" };
  if (p < 0.30) return { label: "ELEVATED", tone: "text-amber-300" };
  return { label: "HIGH", tone: "text-warn" };
}

export function CHIExplainer({ posterior, chiStar, missionId, gate }: Props) {
  const chi = posterior.chi.mean;
  const [chiLo, chiHi] = posterior.chi.ci90;
  const pET = posterior.pEarlyTermination.mean;
  const [pETLo, pETHi] = posterior.pEarlyTermination.ci90;
  const lcd = posterior.expectedLostCrewDays.mean;
  const [lcdLo, lcdHi] = posterior.expectedLostCrewDays.ci90;

  const severity = severityBucket(chi, chiStar);
  const etBucket = pctBucket(pET);
  // Non-operational LxC appendix mapping driven by the Monte-Carlo output.
  // Gate review flags are not converted into applicant risk postures.
  const lxc = assessLxC(posterior, gate);
  const lxcTone = LXC_COLOR_TONE[lxc.color];
  const lxcBorder = LXC_COLOR_BORDER[lxc.color];

  return (
    <section className={`panel p-6 border-l-2 ${lxcBorder}`}>
      {/* ── REVIEW-FLAG BANNER ──────────────────────────────────────────── */}
      {gate?.verdict === "disqualified" && (
        <div
          role="alert"
          className="mb-5 panel border border-red-500 bg-red-50 rounded-md p-4"
          data-testid="disqualified-banner"
        >
          <div className="font-semibold text-red-900 mb-2">
            REVIEW REQUIRED — clearance gate flag
          </div>
          <p className="text-sm text-red-800 mb-2">
            One or more binary clearance gates were flagged. The Stage B Monte
            Carlo result is not converted into an applicant verdict; this panel
            only shows the flagged inputs for human review.
          </p>
          <ul className="mt-2 list-disc list-inside text-sm text-red-800 font-mono">
            {gate.failedGates.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
          {gate.notes && (
            <p className="text-xs text-red-700 mt-2 italic">Note: {gate.notes}</p>
          )}
        </div>
      )}

      <header className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <h2 className="display text-lg text-ink-0">
          Experimental LxC comparison
        </h2>
        <span className={`mono text-[10px] uppercase tracking-cap ${lxcTone}`}>
          appendix mapping · {lxc.color.toUpperCase()} · LxC = {lxc.score}
        </span>
      </header>

      {/* ── NON-OPERATIONAL LxC APPENDIX MAPPING ───────────────────────── */}
      <div className={`mb-6 border ${lxcBorder} rounded-md p-4 bg-bg-1/40`}>
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
          <h3 className="display text-base text-ink-0">
            Likelihood × Consequence appendix matrix
          </h3>
          <span className="mono text-[10px] uppercase tracking-cap text-ink-3">
            experimental · non-NASA
          </span>
        </div>
        <p className="text-sm text-ink-1 leading-relaxed mb-4">
          This legacy panel maps a simulation run onto a 5×5 likelihood ×
          consequence grid for technical comparison only. It is not a NASA risk
          disposition, not an applicant eligibility decision, and not evidence
          that analog outcomes have been externally validated. The mapping uses
          configured likelihood and crew-time-loss bands to make assumptions
          explicit.
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
                <span className={`mono uppercase tracking-cap ${lxcTone}`}>
                  {lxc.color}
                </span>{" "}
                (configured cut-offs: green ≤ 10, yellow 11–19, red ≥ 20).
              </p>
            </div>
            <div className={`border-t ${lxcBorder} pt-3 mt-3`}>
              <span className="mono text-[10px] uppercase tracking-cap text-ink-3">
                appendix interpretation
              </span>
              <p className="mt-1">{LXC_COLOR_GUIDANCE[lxc.color]}</p>
            </div>
          </div>
        </div>

        <p className="mono mt-4 pt-3 border-t border-line/40 text-[10px] text-ink-3 leading-relaxed">
          This mapping is a developer comparison. Its quantitative bridge from
          chi-gap to consequence band (1 %, 5 %, 15 %, 30 % crew-days lost) is
          defined in src/risk/lxc-definitions.ts and is not an endorsed external
          threshold set. Per-mission LxC chips appear in the Mission Comparison
          panel below.
        </p>
      </div>

      <header className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <h3 className="display text-base text-ink-0">
          Crew Health Index
        </h3>
        <span className={`mono text-[10px] uppercase tracking-cap ${severity.tone}`}>
          scenario status · {severity.label}
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
            between scales linearly. This is a single-number readout for
            mission-level health, computed by a stochastic forward Monte-Carlo
            over the modeled medical conditions.
          </p>
        </div>
        <div>
          <div className="mono text-[10px] uppercase tracking-cap text-ink-3 mb-1">
            χ* — Operational Floor
          </div>
          <p className="text-sm text-ink-1 leading-relaxed">
            <span className="mono text-ink-0">χ* = {chiStar.toFixed(2)}</span> · the minimum CHI
            this run is configured to accept. Adjustable on the previous step.
            Tighter floors (0.8+) raise the bar for demanding scenarios; looser
            floors (0.6) suit lower-risk analog campaigns. The simulated
            probability that <span className="mono">χ &lt; χ*</span> is reported as{" "}
            <em>threshold-failure risk</em> below.
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
            possible futures fall below the configured health threshold" —
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
        <p className="text-sm text-ink-1 leading-relaxed">
          This is a research scenario tool, not an autonomous selector. The CHI
          and threshold-failure probability are inputs to human review. A STRONG
          status means the configured model does not flag the scenario; a
          MARGINAL or DEGRADED status does not categorically disqualify a crew,
          but it does require documented review of assumptions and mitigations.
        </p>
      </div>
    </section>
  );
}
