// Throwaway: reproduce best vs worst vs midpoint candidate on canonical missions.
// Diagnostic for the "bad candidate goes green on Antarctic/Mars" bug.
// G8 extension (2026-05-21): 4th candidate level DISQUALIFIED (MMPI-2-RF EID raw=120)
// to verify gate override: DISQ → LxC red on every mission.
import { ANALOG_MISSIONS } from "../src/data/analog-missions";
import { ANALOG_CONDITIONS } from "../src/risk/conditions";
import { SYNTHETIC_PRIORS, synthesizeCrew } from "../src/data/synthetic-iter3";
import { simulateMission } from "../src/risk/simulate";
import { assessLxC } from "../src/risk/lxc";
import { evaluateGates } from "../src/engine/gates";
import { PLACEHOLDER_CRITERIA } from "../src/data/placeholder-criteria";

function buildCandidate(label: string, scoreFraction: number) {
  const scores: Record<string, number> = {};
  for (const c of PLACEHOLDER_CRITERIA) {
    const range = c.scale.max - c.scale.min;
    const value = c.higherIsBetter
      ? c.scale.min + scoreFraction * range
      : c.scale.max - scoreFraction * range;
    scores[c.id] = value;
  }
  return { id: label, alias: label, scores };
}

const WORST = buildCandidate("WORST", 0.0);
const BEST  = buildCandidate("BEST",  1.0);
const MID   = buildCandidate("MID",   0.5);

// Disqualified candidate: middling scores everywhere EXCEPT MMPI-2-RF EID
// raw = 120 (max), which fails the gate (fail-if-above 65).
const DISQUALIFIED = (() => {
  const c = buildCandidate("DISQ", 0.5); // start midrange everywhere
  c.scores["psych.mmpi2rf_eid"] = 120;   // max raw = max EID = fail gate
  return { ...c, id: "DISQ", alias: "DISQ" };
})();

console.log("\n--- conditions with vulnerabilityCriteria ---");
let withVuln = 0;
for (const cond of ANALOG_CONDITIONS) {
  if (cond.vulnerabilityCriteria.length > 0) {
    withVuln++;
    console.log(`  ${cond.id}: [${cond.vulnerabilityCriteria.join(",")}]`);
  }
}
console.log(`  ${withVuln}/${ANALOG_CONDITIONS.length} conditions reference Selectron criteria`);

const missions = ["antarctic-winter-over", "mars500-520d", "hi-seas-90d", "hi-seas-45d", "mdrs-2wk"];
const T = 20_000;
const SEED = 0xc0ffee;

console.log("\n--- Per-mission results (T=20k) ---");
for (const mid of missions) {
  const m = ANALOG_MISSIONS.find((x) => x.id === mid);
  if (!m) { console.log(`SKIP ${mid}`); continue; }
  console.log(`\n=== ${m.id} (${m.durationDays}d, n=${m.crewSize}, EVAs=${m.evaCount}) ===`);
  for (const [label, cand] of [["WORST", WORST], ["MID", MID], ["BEST", BEST], ["DISQ", DISQUALIFIED]] as const) {
    const gate = evaluateGates(cand, PLACEHOLDER_CRITERIA);
    const crew = synthesizeCrew(cand, m.crewSize);
    const p = simulateMission(crew, m, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, {
      seed: SEED, trials: T, chiStar: 0.7, diagnostics: false,
    });
    const lxc = assessLxC(p, gate);
    const verdict = gate.verdict === "disqualified" ? `DISQ:${gate.failedGates.join(",")}` : "qualified";
    console.log(
      `  ${label.padEnd(5)} | CHI ${(p.chi.mean * 100).toFixed(2)}% | ` +
        `pET ${(p.pEarlyTermination.mean * 100).toFixed(2)}% | ` +
        `ELCD ${p.expectedLostCrewDays.mean.toFixed(1)} | ` +
        `LxC L${lxc.likelihood}×C${lxc.consequence}=${lxc.score} ${lxc.color} | ${verdict}`,
    );
  }
}
