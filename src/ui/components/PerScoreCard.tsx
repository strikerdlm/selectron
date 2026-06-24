// src/ui/components/PerScoreCard.tsx
// Per-criterion score entry card for CrewMemberCard expanded body.
// Commit 2: range slider + citation chip (no ECharts).
// Commit 3: ECharts bell-curve mini-figure added above the slider.

import { useCallback } from "react";
import type { Criterion } from "../../types";
import { normalizeScore } from "../../engine/normalize";
import { citationsFor } from "../../data/citations";
import { CitationChip } from "./CitationChip";

interface PerScoreCardProps {
  criterion: Criterion;
  rawScore: number;
  /** Fires on every input event (live slider feedback). */
  onScoreChange: (criterionId: string, value: number) => void;
  /** Optional mini-figure slot — populated in Commit 3 by CallerCrewMemberCard. */
  figure?: React.ReactNode;
}

/** Compute step size: (max-min)/100, floored to avoid 0. */
function sliderStep(c: Criterion): number {
  const range = c.scale.max - c.scale.min;
  return Math.max(range / 100, 0.01);
}

/** Demo-threshold status for display. */
function gateStatus(c: Criterion, raw: number): "pass" | "fail" | "none" {
  if (!c.gateThreshold) return "none";
  const { operator, value } = c.gateThreshold;
  const fails = operator === "fail-if-below" ? raw < value : raw > value;
  return fails ? "fail" : "pass";
}

function FamilyBadge({ family }: { family: string }) {
  const colours: Record<string, string> = {
    psychological: "#9b5fc7",
    physical: "#0072B2",
    professional: "#009E73",
    behavioral: "#E69F00",
    cognitive: "#56B4E9",
  };
  return (
    <span
      className="mono text-[11px] uppercase tracking-cap px-1.5 py-0.5 rounded-full"
      style={{
        color: colours[family] ?? "var(--ink-2)",
        background: (colours[family] ?? "var(--ink-2)") + "18",
      }}
    >
      {family}
    </span>
  );
}

export function PerScoreCard({ criterion, rawScore, onScoreChange, figure }: PerScoreCardProps) {
  // Clamp raw to scale before normalizing (prevents E_BAD_SCORE)
  const clampedRaw = Math.max(criterion.scale.min, Math.min(criterion.scale.max, rawScore));
  const normScore = normalizeScore(clampedRaw, criterion.scale, criterion.higherIsBetter);

  const gate = gateStatus(criterion, clampedRaw);
  const step = sliderStep(criterion);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onScoreChange(criterion.id, parseFloat(e.target.value));
    },
    [criterion.id, onScoreChange],
  );

  // Citations — use primary if available, fall back to validation
  const primaryCitation = citationsFor(`criterion:${criterion.id}:primary`);
  const validationCitation = citationsFor(`criterion:${criterion.id}:validation`);
  const gateCitationKey = criterion.gateThreshold
    ? `gate:${criterion.id}:threshold-${criterion.gateThreshold.operator === "fail-if-above" ? criterion.gateThreshold.value : `minus-${Math.abs(criterion.gateThreshold.value)}`}`
    : null;
  const gateCitation = gateCitationKey ? citationsFor(gateCitationKey) : undefined;

  return (
    <div
      className="rounded border px-3 py-3 flex flex-col gap-2"
      style={{
        borderColor: gate === "fail" ? "var(--warn)" : "var(--line)",
        background: gate === "fail" ? "rgba(255,107,94,0.03)" : "transparent",
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="mono text-[14px] text-ink-0 font-medium">
              {criterion.label}
            </span>
            <FamilyBadge family={criterion.family} />
            {/* Gate indicator */}
            {criterion.gateThreshold && (
              <span
                className="mono text-[11px] uppercase tracking-cap px-1.5 py-0.5 rounded-full border"
                style={{
                  color: gate === "fail" ? "var(--warn)" : "var(--ink-2)",
                  borderColor: gate === "fail" ? "var(--warn)" : "var(--line)",
                  background: gate === "fail" ? "rgba(255,107,94,0.08)" : "transparent",
                }}
              >
                {gate === "fail" ? "review flag" : "no flag"}
              </span>
            )}
          </div>
          {/* Instrument */}
          <span className="mono text-[12px] text-ink-3 truncate">
            {criterion.instrument}
          </span>
        </div>

        {/* Normalised score */}
        <div className="shrink-0 flex flex-col items-end">
          <span
            className="mono text-[18px] tabular-nums font-medium"
            style={{ color: "var(--ink-1)" }}
          >
            {Math.round(normScore * 100)}%
          </span>
          <span className="mono text-[11px] text-ink-3">
            norm.
          </span>
        </div>
      </div>

      {/* Mini-figure slot (Commit 3+) */}
      {figure && (
        <div className="overflow-hidden rounded" style={{ minHeight: 80 }}>
          {figure}
        </div>
      )}

      {/* Slider */}
      <div className="flex flex-col gap-1">
        <input
          type="range"
          min={criterion.scale.min}
          max={criterion.scale.max}
          step={step}
          value={clampedRaw}
          className="instrument w-full"
          onChange={handleChange}
          aria-label={`${criterion.label} raw score`}
          aria-valuemin={criterion.scale.min}
          aria-valuemax={criterion.scale.max}
          aria-valuenow={clampedRaw}
          aria-valuetext={`${clampedRaw.toFixed(1)} (${criterion.higherIsBetter ? "higher is better" : "lower is better"})`}
        />
        {/* Scale labels */}
        <div className="flex justify-between mono text-[11px] text-ink-3">
          <span>{criterion.scale.min}</span>
          <span className="text-ink-1 font-medium">
            {clampedRaw.toFixed(1)}
          </span>
          <span>{criterion.scale.max}</span>
        </div>
      </div>

      {/* Gate threshold annotation */}
      {criterion.gateThreshold && (
        <div
          className="mono text-[12px] px-2 py-1 rounded"
          style={{
            background: "rgba(0,0,0,0.15)",
            color: gate === "fail" ? "var(--warn)" : "var(--ink-3)",
          }}
        >
          {criterion.gateThreshold.operator === "fail-if-above"
            ? `demo threshold: review if above ${criterion.gateThreshold.value}`
            : `demo threshold: review if below ${criterion.gateThreshold.value}`}
          {" · "}
          <span className="text-ink-3">{criterion.higherIsBetter ? "↑ higher = better" : "↓ lower = better"}</span>
        </div>
      )}

      {/* Citations */}
      <div className="flex flex-col gap-1.5 border-t border-line pt-2">
        {primaryCitation && (
          <CitationChip citation={primaryCitation} />
        )}
        {validationCitation && (
          <CitationChip citation={validationCitation} />
        )}
        {gateCitation && gateCitation !== primaryCitation && (
          <div className="flex items-baseline gap-1.5">
            <span className="mono text-[11px] uppercase tracking-cap text-ink-3">threshold:</span>
            <CitationChip citation={gateCitation} />
          </div>
        )}
      </div>
    </div>
  );
}
