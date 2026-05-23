// Extract the v0.5.0 observed CI₉₅ widths per scenario × metric.
// Used to baseline the IMM-86 width-assertion brackets (peer-review-2 Issue 5).
import { simulateIMM } from "../src/imm/simulate";
import { IMM_KITS } from "../src/imm/kits";
import { IMM_MISSIONS } from "../src/data/imm-missions";
import { K15_REFERENCE_CREW } from "../src/imm/calibration";

const iss6 = IMM_MISSIONS.find(m => m.id === "iss-6mo")!;
const SEED = 0xc0ffee;
const T = 100_000;

console.log(`\nv0.5.0 observed CI₉₅ widths (T = ${T.toLocaleString()}, seed = 0xc0ffee, K15 reference crew on iss-6mo)\n`);
console.log(`Scenario     TME        CHI       pEVAC %   pLOCL %`);
for (const id of ["none", "issHMS", "unlimited"] as const) {
  const out = simulateIMM({ crew: K15_REFERENCE_CREW, mission: iss6, kit: IMM_KITS[id], trials: T, seed: SEED });
  const w = (ci: [number, number]) => (ci[1] - ci[0]).toFixed(2);
  console.log(`${id.padEnd(12)} ${w(out.tme.ci95).padStart(6)}     ${w(out.chi.ci95).padStart(6)}    ${w(out.pEvac.ci95).padStart(6)}    ${w(out.pLocl.ci95).padStart(6)}`);
}
