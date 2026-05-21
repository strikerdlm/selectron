// scripts/calibrate_imm_priors.ts
// T32: CLI wrapper — runs Tier-C global multiplier coordinate-descent back-fit
// and writes results back to src/data/imm-priors.json.
//
// Usage: npm run calibrate:imm
//   (runs via tsx, Node-only context — fs writes are safe here)

import { calibrateTierCMultipliers } from "../src/imm/calibration";

const result = await calibrateTierCMultipliers(true);   // writeBack = true
console.log(JSON.stringify(result, null, 2));
console.log("\nCalibration complete. Run `git diff src/data/imm-priors.json` to review changes.");
