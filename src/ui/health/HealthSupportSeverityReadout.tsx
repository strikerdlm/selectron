type Props = {
  tierLabel: string;
  chiMean: number;            // percent scale 0–100
  issBaselineChi: number;     // percent scale 0–100
  verdictColor: "green" | "yellow" | "red";
  verdictScore: number;
};

const CHIP = {
  green: "text-emerald-300 border-emerald-500/40",
  yellow: "text-amber-300 border-amber-500/40",
  red: "text-warn border-warn/40",
} as const;

export function HealthSupportSeverityReadout({
  tierLabel, chiMean, issBaselineChi, verdictColor, verdictScore,
}: Props) {
  const delta = chiMean - issBaselineChi;
  const sign = delta >= 0 ? "+" : "−";
  return (
    <div className="panel flex flex-col gap-2">
      <h4 className="label text-[12px] text-ink-2 uppercase tracking-cap">Severity · {tierLabel}</h4>
      <div className="flex items-baseline gap-3">
        <span className="display text-2xl text-ink-0 tabular-nums">{chiMean.toFixed(1)}</span>
        <span className="mono text-[13px] text-ink-2">CHI %</span>
        <span className="mono text-[13px] text-ink-3">
          {sign}{Math.abs(delta).toFixed(1)} vs ISS
        </span>
      </div>
      <div className={"mono text-[12px] inline-block self-start px-1.5 py-0.5 border rounded-sm uppercase tracking-cap " + CHIP[verdictColor]}>
        appendix LxC {verdictColor} · score {verdictScore}
      </div>
    </div>
  );
}
