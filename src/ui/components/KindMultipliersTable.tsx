// src/ui/components/KindMultipliersTable.tsx
//
// Compact per-(mission-kind, condition) multiplier table for the Crew
// Composition view. Renders the conditions whose `kind_multipliers[kind]`
// entry in `imm-priors.json::global_calibration` differs from 1.0, sorted
// by |mult − 1| descending so the strongest effect sits at the top.
//
// Empty state: "no per-condition multipliers for this kind — base priors
// apply." (Triggers for `leo-iss` and the legacy `analog-isolation` kind.)
//
// Confidence labels (HIGH / MED / LOW) are a static literal mirroring
// `research/evidence_extracted/antarctic_kind_multipliers.md` (the dossier
// is the source of truth). If the dossier is updated, this literal must
// be updated in lockstep — see "Re-validation" in the dossier.

import { loadIMMPriors } from "../../imm/priors";
import { IMM_CONDITIONS } from "../../imm/conditions";
import type { IMMMissionKind } from "../../imm/types";

type Confidence = "HIGH" | "MED" | "LOW";

// Mirror of `antarctic_kind_multipliers.md` confidence column for rows
// where mult ≠ 1.0. Keys are `${kind}/${conditionId}`. Zero-multiplier
// rows (which we render with mult=0.0) are not enumerated here because
// they all derive from a "physics" rationale and read as HIGH by default.
const CONFIDENCE: Record<string, Confidence> = {
  // antarctic-station
  "antarctic-station/depression": "HIGH",
  "antarctic-station/anxiety": "MED",
  "antarctic-station/respiratory-infection": "MED",
  "antarctic-station/gastroenteritis": "LOW",
  "antarctic-station/skin-rash": "MED",
  "antarctic-station/late-insomnia": "MED",
  "antarctic-station/frostbite": "LOW",
  "antarctic-station/altitude-sickness": "LOW",
  "antarctic-station/hypoxia-related-headache": "LOW",
  "antarctic-station/seasonal-affective-disorder": "LOW",
  "antarctic-station/headache-co2-induced": "HIGH",
  "antarctic-station/decompression-sickness-secondary-to-extravehicular-activity": "HIGH",
  "antarctic-station/visual-impairment-and-intracranial-pressure-viip-space-adaptation": "HIGH",
  "antarctic-station/barotrauma-ear-sinus-block": "HIGH",
  "antarctic-station/insomnia-space-adaptation": "MED",
  // interpersonal-conflict (Bell 2019 / Marcinkowski 2021 / Basner 2014)
  "antarctic-station/interpersonal-conflict": "MED",
  "analog-controlled/interpersonal-conflict": "MED",
  // analog-controlled
  "analog-controlled/respiratory-infection": "MED",
  "analog-controlled/depression": "MED",
};

const CONFIDENCE_COLOR: Record<Confidence, string> = {
  HIGH: "text-go",
  MED: "text-amber-400",
  LOW: "text-ink-3",
};

function confidenceFor(kind: IMMMissionKind, conditionId: string, mult: number): Confidence {
  // Zero-multiplier rows are ECLSS-specific suppressions with a
  // "physics" rationale in the dossier — render as HIGH by default.
  if (mult === 0) return "HIGH";
  return CONFIDENCE[`${kind}/${conditionId}`] ?? "LOW";
}

// Friendly label for a condition id, falling back to the raw id.
const CONDITION_LOOKUP: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const c of IMM_CONDITIONS) out[c.id] = c.label;
  return out;
})();

export function KindMultipliersTable({ kind }: { kind: IMMMissionKind }) {
  // Read the per-kind map defensively. The JSON validator guarantees the
  // shape, but the auto-generated `kind_multipliers` block could be
  // missing for legacy/future kinds.
  const rawMap = loadIMMPriors().global_calibration.kind_multipliers?.[kind] ?? {};

  // Build the row set: skip documentation sentinel keys (_doc_) and any
  // row whose multiplier is exactly 1.0 (no effect).
  type Row = { conditionId: string; mult: number; label: string; conf: Confidence; delta: number };
  const rows: Row[] = [];
  for (const [conditionId, mult] of Object.entries(rawMap)) {
    if (conditionId.startsWith("_")) continue;
    if (typeof mult !== "number" || !Number.isFinite(mult)) continue;
    if (mult === 1.0) continue;
    rows.push({
      conditionId,
      mult,
      label: CONDITION_LOOKUP[conditionId] ?? conditionId,
      conf: confidenceFor(kind, conditionId, mult),
      delta: Math.abs(mult - 1),
    });
  }
  rows.sort((a, b) => b.delta - a.delta);

  if (rows.length === 0) {
    return (
      <div
        className="mono text-[12px] text-ink-3 italic"
        data-testid="kind-multipliers-empty"
      >
        no per-condition multipliers for this kind — base priors apply.
      </div>
    );
  }

  return (
    <div data-testid="kind-multipliers-table">
      <table className="w-full mono text-[12px] border-collapse">
        <thead>
          <tr className="text-ink-3 text-left">
            <th className="font-normal pb-1 pr-3">condition</th>
            <th className="font-normal pb-1 pr-3 text-right">multiplier</th>
            <th className="font-normal pb-1 pr-3">evidence</th>
            <th className="font-normal pb-1 text-right">conf.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.conditionId}
              data-testid="kind-mult-row"
              data-condition-id={r.conditionId}
              data-kind-mult={r.mult.toFixed(2)}
              data-conf={r.conf}
              className="border-t border-line/40"
            >
              <td className="py-1 pr-3 text-ink-1">{r.label}</td>
              <td className="py-1 pr-3 text-ink-0 text-right tabular-nums">
                {r.mult.toFixed(2)}×
              </td>
              <td className="py-1 pr-3 text-ink-3">
                {/* Source_ref is the markdown filename or anchor — short
                    and self-describing (e.g. "DOI:10.3402/ijch.v63i2.17702"). */}
                {sourceRefFor(r.conditionId)}
              </td>
              <td className={"py-1 text-right " + CONFIDENCE_COLOR[r.conf]}>
                {r.conf}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mono text-[10px] text-ink-3 mt-2">
        Source: <code>imm-priors.json::global_calibration.kind_multipliers[{kind}]</code>{" "}
        + <code>research/evidence_extracted/antarctic_kind_multipliers.md</code>
      </p>
    </div>
  );
}

// Look up the `source_ref` field of an IMMPrior for display. Falls back
// to "—" if the condition is not in the priors file (forward-compatible
// for `frostbite` / `altitude-sickness` / `hypoxia-related-headache` /
// `seasonal-affective-disorder` which are referenced in the JSON block
// but not yet in IMM_CONDITIONS).
function sourceRefFor(conditionId: string): string {
  const priors = loadIMMPriors().conditions[conditionId];
  return priors?.source_ref ?? "—";
}
