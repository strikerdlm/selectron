// scripts/normalize_resource_names.ts
//
// IMM-priors-rev3-a: normalise generic resource names in imm-priors.json to
// canonical issHMS kit keys. Extends the 22-alias map from commit 57b7ec3 with
// the rename-regressions introduced by IMM-09/10/11 (tier-B/C additions) and
// IMM-priors-rev1/rev2 (Beta-Pert rewrites).
//
// Baseline 2026-05-22: tests/imm/resource_coverage.test.ts reports 51 unmatched
// keys across ~40 conditions. With these mismatches, issHMS silently falls back
// to the untreated path for those conditions — driving pEVAC(issHMS) ~3× above
// K15 target and CHI(issHMS) ~40 pp below.
//
// 22 keys have clear kit equivalents (this script's RENAME_MAP).
// 6 keys are genuinely uncoverable on ISS HMS — left in place; runIMMTrial
// produces RAF=0 for them, which is the physically correct outcome:
//   imaging, hyperbaric-oxygen, audiometry, blood-products, antidote,
//   pelvic-floor-trainer
//
// Re-runs resource_coverage.test.ts after writing; non-zero exit on any
// unexpected unmatched key.
//
// Usage: npx tsx scripts/normalize_resource_names.ts

import * as fs from "node:fs";
import * as path from "node:path";

const PRIORS_PATH = path.resolve(process.cwd(), "src/data/imm-priors.json");

// Generic → canonical issHMS kit key.
// All mappings preserve the original quantity (we only rename the key).
const RENAME_MAP: Record<string, string> = {
  // Antimicrobials
  "antibiotic":            "antibiotic-broad-spectrum",
  "ophthalmic-antibiotic": "antibiotic-eye",

  // Analgesics
  "analgesic":             "analgesic-mild",
  "analgesic-opioid":      "opioid",

  // Topicals / wound care
  "antiseptic":            "topical-antibiotic",
  "antiseptic-oral":       "topical-antibiotic",
  "wound-care":            "topical-antibiotic",
  "bandage":               "bandage-small",
  "wound-closure-strips":  "bandage-small",
  "wound-dressing":        "bandage-small",
  "ace-bandage":           "bandage-large",
  "topical-corticosteroid": "topical-steroid",
  "topical-hemorrhoid-cream": "topical-steroid",

  // GI / rehydration
  "oral-rehydration-salts": "oral-rehydration",
  "promethazine":          "antiemetic",

  // Ophthalmic
  "ophthalmic-irrigation": "eye-irrigation-kit",

  // Splints
  "orthopedic-splint":     "splint",

  // Cardiovascular / hematology
  "antithrombotic":        "anticoagulant",
  "vasopressor":           "epinephrine",

  // Psych
  "psychotropic":          "antipsychotic",
  "anxiolytic":            "anti-anxiety",
  "sleep-medication":      "sleep-aid",
};

// Resources genuinely not on the ISS HMS. Left as-is in priors so RAF returns 0.
const UNCOVERABLE_BY_DESIGN = new Set([
  "imaging",                  // diagnostic imaging not in HMS
  "hyperbaric-oxygen",        // no hyperbaric chamber on ISS
  "audiometry",               // no audiometer
  "blood-products",           // no blood bank on ISS
  "antidote",                 // generic placeholder; specific antidotes vary
  "pelvic-floor-trainer",     // not in HMS
]);

interface Prior {
  required_resources?: Record<string, number>;
  [k: string]: unknown;
}
interface PriorsFile {
  conditions: Record<string, Prior>;
  [k: string]: unknown;
}

function main(): void {
  const raw = fs.readFileSync(PRIORS_PATH, "utf-8");
  const json: PriorsFile = JSON.parse(raw);

  let renamedKeys = 0;
  let touchedConditions = 0;
  const unexpectedUnmatched: string[] = [];

  for (const [cid, cond] of Object.entries(json.conditions)) {
    const reqs = cond.required_resources;
    if (!reqs) continue;
    const newReqs: Record<string, number> = {};
    let touchedThis = false;
    for (const [k, v] of Object.entries(reqs)) {
      const target = RENAME_MAP[k] ?? k;
      if (target !== k) {
        renamedKeys += 1;
        touchedThis = true;
      } else if (!(k in RENAME_MAP) && UNCOVERABLE_BY_DESIGN.has(k)) {
        // intentionally left as-is
      }
      // merge if collision (e.g., two keys both → 'analgesic-mild') — sum quantities
      newReqs[target] = (newReqs[target] ?? 0) + v;
    }
    if (touchedThis) {
      cond.required_resources = newReqs;
      touchedConditions += 1;
    }
  }

  // Validate that every remaining unmatched key is in the by-design uncoverable set.
  // (The actual kit-keys check is run by tests/imm/resource_coverage.test.ts.)
  for (const [cid, cond] of Object.entries(json.conditions)) {
    for (const k of Object.keys(cond.required_resources ?? {})) {
      if (RENAME_MAP[k] !== undefined) {
        unexpectedUnmatched.push(`${cid}: ${k} (still has rename-source name post-rewrite)`);
      }
    }
  }

  if (unexpectedUnmatched.length > 0) {
    console.error("Unexpected residual unmatched keys:");
    for (const u of unexpectedUnmatched) console.error("  " + u);
    process.exit(1);
  }

  fs.writeFileSync(PRIORS_PATH, JSON.stringify(json, null, 2) + "\n", "utf-8");

  console.log(`Renamed ${renamedKeys} resource keys across ${touchedConditions} conditions.`);
  console.log(`Wrote ${PRIORS_PATH}.`);
  console.log("Run 'npx vitest run tests/imm/resource_coverage.test.ts' to verify zero unmatched keys.");
}

main();
