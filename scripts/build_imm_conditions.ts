// scripts/build_imm_conditions.ts
// Parses research/imm_sources/architecture/K15_keenan_2015_imm_probabilistic_simulation.md
// appendix table and emits src/imm/conditions.ts.
//
// Re-run: `npx tsx scripts/build_imm_conditions.ts`

import { readFileSync, writeFileSync } from "node:fs";

const md = readFileSync(
  "research/imm_sources/architecture/K15_keenan_2015_imm_probabilistic_simulation.md",
  "utf-8"
);

// Extract appendix table rows (markdown table format `| col | col | col | col |`)
// Only lines starting with `| ` followed by an uppercase letter
const rows = md
  .split("\n")
  .filter((l) => /^\|\s+[A-Z]/.test(l) && l.includes("|"));

// Drop header rows ("Medical Condition | Incidence Data Source") and separator rows
// Also drop Table 1 result rows (TME, CHI, pEVAC, pLOCL) which don't have distribution values
const VALID_DISTS = new Set(["Gamma", "Lognormal", "Beta", "Fixed"]);
const dataRows = rows.filter((l) => {
  if (/Medical Condition\s*\|\s*Incidence Data Source/.test(l)) return false;
  // Parse the distribution column (3rd cell)
  const cells = l.split("|").slice(1, -1).map((c) => c.trim());
  if (cells.length < 3) return false;
  // The dist cell must be one of the four valid distributions
  return VALID_DISTS.has(cells[2]);
});

// ── Family inference ──────────────────────────────────────────────────────────
// Walk every K15 condition label and assign to one of the 19 IMMConditionFamily values.
// Order of checks matters: more-specific patterns first.

function inferFamily(label: string): string {
  const lc = label.toLowerCase();

  // Space-adaptation conditions (must check before generic terms)
  if (lc.includes("space adaptation") || lc.includes("(space adaptation)")) return "space-adaptation";
  if (lc.includes("viip")) return "space-adaptation";
  // Nose bleed (space adaptation) and Nasal Congestion (space adaptation) caught above

  // Dental
  if (lc.includes("dental")) return "dental";

  // Ophthalmologic
  if (lc.startsWith("eye") || lc.includes("retinal") || lc.includes("glaucoma") || lc.includes("viip")) return "ophthalmologic";

  // ENT
  if (
    lc.includes("sinusitis") ||
    lc.includes("otitis") ||
    lc.includes("pharyngitis") ||
    lc.includes("hearing loss") ||
    lc.includes("barotrauma") ||
    lc.includes("nose bleed") ||
    lc.includes("mouth ulcer")
  ) return "ENT";

  // Behavioral
  if (lc.includes("behavioral emergency")) return "behavioral";

  // Psychiatric
  if (lc.includes("anxiety") || lc.includes("depression") || lc.includes("insomnia")) return "psychiatric";

  // Neurologic
  if (
    lc.includes("seizure") ||
    lc.includes("paresthesia") ||
    lc.includes("headache") ||
    lc.includes("stroke") ||
    lc.includes("neurogenic shock") ||
    lc.includes("altitude sickness")
  ) return "neurologic";

  // Cardiovascular
  if (
    lc.includes("cardiac") ||
    lc.includes("angina") ||
    lc.includes("myocardial infarction") ||
    lc.includes("atrial fib") ||
    lc.includes("atrial flutter") ||
    lc.includes("hypertension") ||
    lc.includes("cardiogenic shock")
  ) return "cardiovascular";

  // GU (genitourinary) — before GI so "uterine" etc. don't fall to GI
  if (
    lc.includes("uterine bleeding") ||
    lc.includes("prostatitis") ||
    lc.includes("urinary tract") ||
    lc.includes("urinary incontinence") ||
    lc.includes("urinary retention") ||
    lc.includes("vaginal yeast") ||
    lc.includes("yeast infection")
  ) return "GU";

  // Renal
  if (lc.includes("nephrolithiasis")) return "renal";

  // GI
  if (
    lc.includes("appendicitis") ||
    lc.includes("cholecystitis") ||
    lc.includes("biliary colic") ||
    lc.includes("diverticulitis") ||
    lc.includes("pancreatitis") ||
    lc.includes("gastroenteritis") ||
    lc.includes("diarrhea") ||
    lc.includes("indigestion") ||
    lc.includes("hemorrhoid") ||
    lc.includes("constipation") ||
    lc.includes("small bowel obstruction") ||
    lc.includes("abdominal wall hernia") ||
    lc.includes("hernia")
  ) return "GI";

  // Musculoskeletal (sprains, strains, fractures, dislocations, back/neck, decompression, fingernail)
  if (
    lc.includes("sprain") ||
    lc.includes("strain") ||
    lc.includes("fracture") ||
    lc.includes("dislocation") ||
    lc.includes("arthritis") ||
    lc.includes("back injury") ||
    lc.includes("neck injury") ||
    lc.includes("hip/proximal") ||
    lc.includes("fingernail") ||
    lc.includes("compartment syndrome") ||
    lc.includes("decompression sickness")
  ) return "musculoskeletal";

  // Infectious
  if (
    lc.includes("infection") ||
    lc.includes("influenza") ||
    lc.includes("herpes zoster") ||
    lc.includes("shingles") ||
    lc.includes("sepsis") ||
    lc.includes("allergic reaction") ||
    lc.includes("anaphylaxis")
  ) return "infectious";

  // Dermatologic (skin, burns, rash, abrasion, laceration, ulcer not eye/mouth)
  if (
    lc.includes("skin") ||
    lc.includes("rash") ||
    lc.includes("burn") ||
    lc.includes("laceration") ||
    lc.includes("abrasion")
  ) return "dermatologic";

  // Respiratory
  if (
    lc.includes("respiratory") ||
    lc.includes("choking") ||
    lc.includes("smoke inhalation")
  ) return "respiratory";

  // Toxicologic
  if (
    lc.includes("toxic") ||
    lc.includes("overdose") ||
    lc.includes("radiation syndrome") ||
    lc.includes("ammonia")
  ) return "toxicologic";

  // Traumatic (injuries, shocks)
  if (
    lc.includes("abdominal injury") ||
    lc.includes("chest injury") ||
    lc.includes("head injury") ||
    lc.includes("hypovolemic shock") ||
    lc.includes("traumatic")
  ) return "traumatic";

  // Behavioral (catch-all for emergency not already caught)
  if (lc.includes("behavioral")) return "behavioral";

  // GI fallback — note any conditions reaching this in the review log
  console.warn(`[WARN] inferFamily fallback "GI" for: "${label}"`);
  return "GI";
}

// ── Process inference ──────────────────────────────────────────────────────────
function inferProcess(label: string, riskFactors: string[]): string {
  const lc = label.toLowerCase();
  if (lc.includes("viip")) return "SA-VIIP-late";
  if (lc.includes("space adaptation") || lc.includes("(space adaptation)")) return "space-adaptation-once";
  if (riskFactors.includes("EVA")) return "EVA-coupled";
  if (riskFactors.includes("SPE")) return "SPE-coupled";
  return "general-Poisson";
}

// ── Risk-factor inference ──────────────────────────────────────────────────────
// K15 lists "Sex" without specifying male/female. We emit BOTH so the simulator
// can apply the relevant multiplier per crew member.
function inferRiskFactors(raw: string): string[] {
  const out: string[] = [];
  const lc = raw.toLowerCase();
  if (lc.includes("sex")) {
    out.push("sex-male");
    out.push("sex-female");
  }
  if (lc.includes("contacts")) out.push("contacts");
  if (lc.includes("crowns")) out.push("crowns");
  if (lc.includes("coronary artery calcium")) out.push("CAC-positive");
  if (lc.includes("abdominal surgery")) out.push("abdominal-surgery-history");
  if (lc.includes("eva")) out.push("EVA");
  if (lc.includes("spe")) out.push("SPE");
  return out;
}

// ── Slug ───────────────────────────────────────────────────────────────────────
const slug = (s: string) =>
  s.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// ── VulnerabilityCriteria inference ───────────────────────────────────────────
// Maps each IMM condition family to the Selectron criteria whose Stage A scores
// should modulate that condition's vulnerability multiplier.
// Criterion IDs must match exactly the `id` fields in src/data/placeholder-criteria.ts.
function inferVulnerabilityCriteria(family: string): string[] {
  const map: Record<string, string[]> = {
    "psychiatric":       ["psych.mmpi2rf_eid", "psych.emotional_stability", "psych.bdi2_baseline"],
    "behavioral":        ["behavioral.teamwork", "psych.conscientiousness"],
    "neurologic":        ["cognitive.nasa_cognition_battery", "psych.emotional_stability"],
    "infectious":        ["physical.vo2max"],
    "musculoskeletal":   ["physical.vo2max"],
    "cardiovascular":    ["physical.vo2max"],
    "respiratory":       ["physical.vo2max"],
    "space-adaptation":  ["physical.vo2max", "psych.emotional_stability"],
    "GI":                [],
    "GU":                [],
    "renal":             [],
    "endocrine":         [],
    "hematologic":       [],
    "dental":            [],
    "ENT":               [],
    "ophthalmologic":    [],
    "dermatologic":      [],
    "toxicologic":       [],
    "traumatic":         ["physical.vo2max"],
  };
  return map[family] ?? [];
}

// ── Build conditions ───────────────────────────────────────────────────────────
const conditions = dataRows.map((line) => {
  const cells = line.split("|").slice(1, -1).map((c) => c.trim());
  const label = cells[0];
  const source = cells[1];
  const dist = cells[2];
  const riskFactorsRaw = cells[3] || "";
  const riskFactors = inferRiskFactors(riskFactorsRaw);
  const family = inferFamily(label);
  return {
    id: slug(label),
    label,
    family,
    incidenceSource:
      source.includes("In-flight")
        ? "in-flight"
        : source.includes("Astronaut")
        ? "astronaut-pre-postflight"
        : source.includes("External")
        ? "external-model"
        : "terrestrial",
    incidenceDist: dist as "Gamma" | "Lognormal" | "Beta" | "Fixed",
    processType: inferProcess(label, riskFactors),
    riskFactors,
    vulnerabilityCriteria: inferVulnerabilityCriteria(family),
  };
});

// ── Emit ───────────────────────────────────────────────────────────────────────
const out = `// AUTO-GENERATED by scripts/build_imm_conditions.ts — do not edit by hand.
// Source: research/imm_sources/architecture/K15_keenan_2015_imm_probabilistic_simulation.md (appendix table).
// Re-run: \`npx tsx scripts/build_imm_conditions.ts\`.

import type { IMMCondition } from "./types";

export const IMM_CONDITIONS: IMMCondition[] = ${JSON.stringify(conditions, null, 2)};
`;

writeFileSync("src/imm/conditions.ts", out);
console.log(`wrote src/imm/conditions.ts with ${conditions.length} conditions`);

// Print per-family counts for review
const familyCounts: Record<string, number> = {};
for (const c of conditions) {
  familyCounts[c.family] = (familyCounts[c.family] ?? 0) + 1;
}
console.log("\nPer-family counts:");
for (const [fam, count] of Object.entries(familyCounts).sort()) {
  console.log(`  ${fam}: ${count}`);
}
