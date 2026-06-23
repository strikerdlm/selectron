import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type EvidenceStatus = {
  ledgerPath: string;
  priorsPath: string;
  acceptedCount: number;
  proposalCount: number;
  proposalRefCount: number;
  proposalRefConditionIds: string[];
  activeParameterCount: number;
  acceptedCoveredParameterCount: number;
  uncoveredParameterCount: number;
  uncoveredParameterPaths: string[];
  malformedAcceptedRows: string[];
  releasePriorsAdjudicated: boolean;
  status: "adjudicated" | "unadjudicated";
  message: string;
};

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LEDGER_PATH = "research/evidence_extracted/evidence_ledger.csv";
const PRIORS_PATH = "src/data/imm-priors.json";

const REQUIRED_ACCEPTED_FIELDS = [
  "parameter_path",
  "study_slug",
  "endpoint_definition",
  "extractor",
  "verifier",
  "risk_of_bias",
  "transportability",
  "uncertainty_distribution",
  "model_version",
  "acceptance_version",
  "prior_value_hash",
];

function parseCsvRecords(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === "\"") {
      if (inQuotes && next === "\"") {
        field += "\"";
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++;
      row.push(field);
      if (row.some((value) => value.trim().length > 0)) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += ch;
  }

  row.push(field);
  if (row.some((value) => value.trim().length > 0)) rows.push(row);
  return rows;
}

function parseCsvRows(text: string): Record<string, string>[] {
  const records = parseCsvRecords(text);
  if (records.length <= 1) return [];
  const headers = records[0].map((h) => h.trim());
  return records.slice(1).map((values) => {
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] ?? "").trim();
    });
    return row;
  });
}

function walkNumericParameters(value: unknown, prefix: string, out: string[]): void {
  if (typeof value === "number" && Number.isFinite(value)) {
    out.push(prefix);
    return;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    walkNumericParameters(child, `${prefix}.${key}`, out);
  }
}

function activeParameterPaths(priors: {
  conditions?: Record<string, unknown>;
  global_calibration?: Record<string, unknown>;
}): string[] {
  const paths: string[] = [];
  for (const [conditionId, rawPrior] of Object.entries(priors.conditions ?? {})) {
    const prior = rawPrior as Record<string, unknown>;
    for (const field of [
      "incidence",
      "severity",
      "outcomeScenarios",
      "treated",
      "untreated",
      "risk_factor_multipliers",
      "required_resources",
    ]) {
      if (prior[field] !== undefined) {
        walkNumericParameters(prior[field], `conditions.${conditionId}.${field}`, paths);
      }
    }
  }

  const global = priors.global_calibration ?? {};
  for (const field of ["tierA_multiplier", "tierB_multiplier", "tierC_multiplier", "kind_multipliers"]) {
    if (global[field] !== undefined) {
      walkNumericParameters(global[field], `global_calibration.${field}`, paths);
    }
  }

  return Array.from(new Set(paths)).sort();
}

function malformedAcceptedRowIds(rows: Record<string, string>[]): string[] {
  const malformed: string[] = [];
  rows.forEach((row, index) => {
    if (row.status !== "accepted") return;
    const missing = REQUIRED_ACCEPTED_FIELDS.filter((field) => !row[field]);
    if (missing.length > 0) {
      malformed.push(`row ${index + 2}: missing ${missing.join("|")}`);
    }
  });
  return malformed;
}

export function buildEvidenceStatus(root = REPO_ROOT): EvidenceStatus {
  const ledgerPath = resolve(root, LEDGER_PATH);
  const priorsPath = resolve(root, PRIORS_PATH);
  const ledgerRows = parseCsvRows(readFileSync(ledgerPath, "utf8"));
  const acceptedCount = ledgerRows.filter((row) => row.status === "accepted").length;
  const proposalCount = ledgerRows.filter((row) => row.status === "proposal").length;

  const priors = JSON.parse(readFileSync(priorsPath, "utf8")) as {
    conditions?: Record<string, { source_ref?: string }>;
    global_calibration?: Record<string, unknown>;
  };
  const proposalRefConditionIds = Object.entries(priors.conditions ?? {})
    .filter(([, prior]) => /proposals_p-/i.test(prior.source_ref ?? ""))
    .map(([conditionId]) => conditionId)
    .sort();

  const parameterPaths = activeParameterPaths(priors);
  const acceptedRows = ledgerRows.filter((row) => row.status === "accepted");
  const malformedRows = malformedAcceptedRowIds(ledgerRows);
  const acceptedParameterPaths = new Set(
    acceptedRows
      .map((row) => row.parameter_path)
      .filter((path): path is string => typeof path === "string" && path.length > 0),
  );
  const uncoveredParameterPaths = parameterPaths.filter((path) => !acceptedParameterPaths.has(path));

  const releasePriorsAdjudicated =
    parameterPaths.length > 0 &&
    uncoveredParameterPaths.length === 0 &&
    proposalRefConditionIds.length === 0 &&
    malformedRows.length === 0;

  return {
    ledgerPath: LEDGER_PATH,
    priorsPath: PRIORS_PATH,
    acceptedCount,
    proposalCount,
    proposalRefCount: proposalRefConditionIds.length,
    proposalRefConditionIds,
    activeParameterCount: parameterPaths.length,
    acceptedCoveredParameterCount: parameterPaths.length - uncoveredParameterPaths.length,
    uncoveredParameterCount: uncoveredParameterPaths.length,
    uncoveredParameterPaths,
    malformedAcceptedRows: malformedRows,
    releasePriorsAdjudicated,
    status: releasePriorsAdjudicated ? "adjudicated" : "unadjudicated",
    message: releasePriorsAdjudicated
      ? "Every active prior parameter is covered by accepted evidence ledger rows."
      : "No complete adjudicated analog evidence release is available; active prior parameters remain uncovered or proposal-stage references remain exploratory.",
  };
}

/** Frontend summary written to src/data/evidence-status.json. Key order is
 *  load-bearing: `--check` compares canonical JSON, so this must match the
 *  order previously written by `--write`. `generatedAt` is the only non-
 *  deterministic field and is carried from the committed file on check. */
function buildFrontendSummary(status: EvidenceStatus, generatedAt: string) {
  return {
    status: status.status,
    releasePriorsAdjudicated: status.releasePriorsAdjudicated,
    acceptedCount: status.acceptedCount,
    proposalCount: status.proposalCount,
    proposalRefCount: status.proposalRefCount,
    proposalRefConditionIds: status.proposalRefConditionIds,
    activeParameterCount: status.activeParameterCount,
    acceptedCoveredParameterCount: status.acceptedCoveredParameterCount,
    uncoveredParameterCount: status.uncoveredParameterCount,
    malformedAcceptedRowCount: status.malformedAcceptedRows.length,
    message: status.message,
    generatedAt,
  };
}

/** F6: regenerate both status objects in memory and fail if the committed
 *  files have drifted. The full status file is fully deterministic and is
 *  compared verbatim; the frontend summary is compared ignoring the
 *  `generatedAt` timestamp (carried from the committed file). */
function checkFreshness(): number {
  const status = buildEvidenceStatus();
  let drift = 0;

  const fullCommitted = readFileSync(
    resolve(REPO_ROOT, "research/evidence_extracted/evidence_status.json"),
    "utf8",
  ).trim();
  const fullExpected = JSON.stringify(status, null, 2);
  if (fullCommitted !== fullExpected) {
    console.error(
      "✗ research/evidence_extracted/evidence_status.json is stale. Run `npm run evidence:status -- --write`.",
    );
    drift++;
  }

  const feCommitted = JSON.parse(
    readFileSync(resolve(REPO_ROOT, "src/data/evidence-status.json"), "utf8"),
  ) as { generatedAt?: string };
  const feExpected = buildFrontendSummary(status, feCommitted.generatedAt ?? "");
  if (JSON.stringify(feCommitted) !== JSON.stringify(feExpected)) {
    console.error(
      "✗ src/data/evidence-status.json is stale. Run `npm run evidence:status -- --write`.",
    );
    drift++;
  }

  if (drift === 0) {
    console.log("evidence-status freshness OK (full + frontend summary match committed files).");
    return 0;
  }
  return 1;
}

function main(): number {
  if (process.argv.includes("--check")) {
    return checkFreshness();
  }
  const status = buildEvidenceStatus();
  const json = JSON.stringify(status, null, 2);
  if (process.argv.includes("--write")) {
    writeFileSync(resolve(REPO_ROOT, "research/evidence_extracted/evidence_status.json"), `${json}\n`);
    const frontendSummary = buildFrontendSummary(status, new Date().toISOString());
    writeFileSync(
      resolve(REPO_ROOT, "src/data/evidence-status.json"),
      `${JSON.stringify(frontendSummary, null, 2)}\n`,
    );
  }
  console.log(json);
  if (process.argv.includes("--require-adjudicated") && !status.releasePriorsAdjudicated) {
    return 1;
  }
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main());
}
