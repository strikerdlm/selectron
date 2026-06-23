// LxC matrix visualization for the non-operational appendix mapping.
// 5×5 grid of priority-scored cells, with this run's (L, C) cell
// highlighted. Pure HTML/CSS — the matrix is discrete and categorical,
// which makes a CSS grid cleaner than ECharts heatmap for this use case.

import {
  LXC_PRIORITY_SCORES,
  LIKELIHOOD_BANDS_IN_MISSION,
  CONSEQUENCE_BANDS_MISSION_OBJ,
  lxcColor,
  type LikelihoodLevel,
  type ConsequenceLevel,
} from "@/engine/lxc-definitions";

// Minimal structural prop — both the archived Stage-B `LxCAssessment` and
// the active crew-level `IMMLxCAssessment` satisfy it, keeping this figure
// pipeline-agnostic like the band definitions it renders.
export type LxCMatrixAssessment = {
  likelihood: LikelihoodLevel;
  consequence: ConsequenceLevel;
};

// Cell fill palette. The matrix uses green/yellow/red bands; we use slightly darker tones so
// the priority-score numbers remain legible on a dark wizard background.
const CELL_FILL = {
  green: "rgba(34, 197, 94, 0.85)",   // emerald-500
  yellow: "rgba(234, 179, 8, 0.88)",  // amber-500
  red: "rgba(220, 38, 38, 0.92)",     // red-600
  gray: "rgba(75, 85, 99, 0.75)",     // gray-600
} as const;

const CELL_TEXT = {
  green: "#0a2014",
  yellow: "#3a2a00",
  red: "#ffffff",
  gray: "#e5e7eb",
} as const;

export function LxCMatrix({ assessment }: { assessment: LxCMatrixAssessment }) {
  // Render likelihood top-to-bottom L=5..1 (matches the published figure).
  const Lrows = [5, 4, 3, 2, 1] as const;
  const Ccols = [1, 2, 3, 4, 5] as const;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[auto_repeat(5,1fr)] gap-1 items-center">
        {/* Header row: empty corner + consequence labels C1..C5 */}
        <div />
        {Ccols.map((C) => (
          <div
            key={`hdr-${C}`}
            className="mono text-[10px] text-ink-3 uppercase tracking-cap text-center pb-1"
          >
            C{C}
          </div>
        ))}

        {/* Each Lrow: y-axis label + 5 cells */}
        {Lrows.map((L) => (
          <Row key={`row-${L}`} L={L} Ccols={Ccols} assessment={assessment} />
        ))}

        {/* Footer row: empty corner + consequence labels repeated for clarity */}
        <div />
        {Ccols.map((C) => {
          const band = CONSEQUENCE_BANDS_MISSION_OBJ[C - 1];
          return (
            <div
              key={`foot-${C}`}
              className="mono text-[9px] text-ink-3 text-center pt-1 leading-tight"
            >
              {band.label}
            </div>
          );
        })}
      </div>

      {/* Axis captions */}
      <div className="grid grid-cols-2 gap-3 mono text-[10px] uppercase tracking-cap text-ink-3">
        <div>
          ← consequence (severity) →
        </div>
        <div className="text-right">↑ likelihood (probability) ↑</div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mono text-[10px] text-ink-2">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-sm border border-line"
            style={{ backgroundColor: CELL_FILL.green }}
          />
          green · score ≤ 10
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-sm border border-line"
            style={{ backgroundColor: CELL_FILL.yellow }}
          />
          yellow · 11–19
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-sm border border-line"
            style={{ backgroundColor: CELL_FILL.red }}
          />
          red · ≥ 20
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm border-2 border-signal" />
          this run
        </span>
      </div>
    </div>
  );
}

function Row({
  L,
  Ccols,
  assessment,
}: {
  L: 1 | 2 | 3 | 4 | 5;
  Ccols: readonly (1 | 2 | 3 | 4 | 5)[];
  assessment: LxCMatrixAssessment;
}) {
  const Lband = LIKELIHOOD_BANDS_IN_MISSION[L - 1];
  return (
    <>
      <div className="mono text-[10px] text-ink-3 uppercase tracking-cap pr-2 text-right leading-tight">
        <div>L{L}</div>
        <div className="text-[8px] normal-case tracking-normal text-ink-3">
          {Lband.label}
        </div>
      </div>
      {Ccols.map((C) => (
        <Cell key={`${L}-${C}`} L={L} C={C} assessment={assessment} />
      ))}
    </>
  );
}

function Cell({
  L,
  C,
  assessment,
}: {
  L: 1 | 2 | 3 | 4 | 5;
  C: 1 | 2 | 3 | 4 | 5;
  assessment: LxCMatrixAssessment;
}) {
  const score = LXC_PRIORITY_SCORES[L - 1][C - 1];
  const color = lxcColor(score);
  const isCurrent = assessment.likelihood === L && assessment.consequence === C;

  return (
    <div
      className={
        "relative aspect-square flex items-center justify-center rounded-sm font-bold text-sm mono tabular-nums transition-all " +
        (isCurrent
          ? "ring-2 ring-signal ring-offset-2 ring-offset-bg-0 shadow-[0_0_18px_rgba(245,181,65,0.7)] scale-110 z-10"
          : "")
      }
      style={{
        backgroundColor: CELL_FILL[color],
        color: CELL_TEXT[color],
      }}
      aria-label={`L${L} C${C} score ${score} ${color}${isCurrent ? " — this run" : ""}`}
      title={`L${L} × C${C} = score ${score} (${color})${isCurrent ? " ← this run" : ""}`}
    >
      {score}
      {isCurrent && (
        <span
          className="absolute -top-1 -right-1 mono text-[8px] uppercase tracking-cap text-signal bg-bg-0 border border-signal px-1 rounded-sm"
          aria-hidden="true"
        >
          ●
        </span>
      )}
    </div>
  );
}
