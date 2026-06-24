import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { basename, dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PROFILE_EFFECTS } from "../src/imm/profile-effects";

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
const SOURCE_CATALOG_DIRS = ["research/evidence", "research/imm_sources"];

const REQUIRED_ACCEPTED_FIELDS = [
  "parameter_path",
  "study_slug",
  "endpoint_definition",
  "numerator",
  "events",
  "repeated_measure_structure",
  "extraction_quote",
  "extractor",
  "verifier",
  "risk_of_bias",
  "transportability",
  "holdout_design",
  "calibration_metrics",
  "transformation",
  "uncertainty_distribution",
  "model_version",
  "acceptance_version",
  "prior_value_hash",
];

type CsvRecord = {
  physicalRow: number;
  values: string[];
};

type EvidenceLedgerRow = {
  index: number;
  rawColumnCount: number;
  status?: string;
  parameter_path?: string;
  study_doi?: string;
  study_slug?: string;
  extractor?: string;
  verifier?: string;
  prior_value_hash?: string;
  [key: string]: string | number | undefined;
};

type SourceCatalogEntry = {
  path: string;
  title?: string;
  doi: string | null;
};

function normalizeDoi(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .toLowerCase();
}

function stripYamlScalar(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function optionalDoi(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const scalar = stripYamlScalar(value);
  if (
    scalar.length === 0 ||
    scalar === "—" ||
    scalar === "-" ||
    /^null$/i.test(scalar) ||
    /^none$/i.test(scalar)
  ) {
    return null;
  }
  return normalizeDoi(scalar);
}

function parseFrontmatter(text: string): Record<string, string> {
  if (!text.startsWith("---")) return {};
  const end = text.indexOf("\n---", 3);
  if (end < 0) return {};
  const frontmatter = text.slice(3, end);
  const parsed: Record<string, string> = {};
  for (const line of frontmatter.split(/\r?\n/)) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) continue;
    parsed[match[1]] = stripYamlScalar(match[2]);
  }
  return parsed;
}

function markdownFiles(root: string, relativeDir: string): string[] {
  const base = resolve(root, relativeDir);
  if (!existsSync(base)) return [];
  const out: string[] = [];
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const abs = resolve(dir, entry);
      const stat = statSync(abs);
      if (stat.isDirectory()) {
        visit(abs);
      } else if (stat.isFile() && extname(abs) === ".md") {
        out.push(relative(root, abs).replace(/\\/g, "/"));
      }
    }
  };
  visit(base);
  return out;
}

function sourceCatalog(root: string): Map<string, SourceCatalogEntry> {
  const catalog = new Map<string, SourceCatalogEntry>();
  for (const dir of SOURCE_CATALOG_DIRS) {
    for (const path of markdownFiles(root, dir)) {
      const frontmatter = parseFrontmatter(readFileSync(resolve(root, path), "utf8"));
      if (Object.keys(frontmatter).length === 0) continue;
      const entry: SourceCatalogEntry = {
        path,
        title: frontmatter.title,
        doi: optionalDoi(frontmatter.doi),
      };
      const slug = basename(path, ".md");
      const relativeSlug = path.replace(/\.md$/, "");
      catalog.set(slug, entry);
      catalog.set(relativeSlug, entry);
      if (frontmatter.ref_id) catalog.set(frontmatter.ref_id, entry);
    }
  }
  return catalog;
}

function parseCsvRecords(text: string): CsvRecord[] {
  const rows: CsvRecord[] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let physicalRow = 1;
  let recordStartRow = 1;

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
      if (row.some((value) => value.trim().length > 0)) {
        rows.push({ physicalRow: recordStartRow, values: row });
      }
      row = [];
      field = "";
      physicalRow++;
      recordStartRow = physicalRow;
      continue;
    }

    if ((ch === "\n" || ch === "\r") && inQuotes) {
      physicalRow++;
    }
    field += ch;
  }

  row.push(field);
  if (row.some((value) => value.trim().length > 0)) {
    rows.push({ physicalRow: recordStartRow, values: row });
  }
  return rows;
}

function parseCsvRows(text: string): EvidenceLedgerRow[] {
  const records = parseCsvRecords(text);
  if (records.length <= 1) return [];
  const headers = records[0].values.map((h) => h.trim());
  return records.slice(1).map(({ physicalRow, values }) => {
    const row: EvidenceLedgerRow = {
      index: physicalRow,
      rawColumnCount: values.length,
    };
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

function profileEffectParameterPaths(): string[] {
  return PROFILE_EFFECTS.flatMap((effect) =>
    typeof effect.estimate === "number" && Number.isFinite(effect.estimate)
      ? [`profile_effects.${effect.profilePath}.${effect.target}.estimate`]
      : [],
  );
}

function activeParameterPaths(priors: {
  conditions?: Record<string, unknown>;
  global_calibration?: Record<string, unknown>;
}, includeProfileEffects: boolean): string[] {
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

  if (includeProfileEffects) {
    paths.push(...profileEffectParameterPaths());
  }

  return Array.from(new Set(paths)).sort();
}

function valueAtPath(root: unknown, path: string): unknown {
  let cur: unknown = root;
  for (const part of path.split(".")) {
    if (!cur || typeof cur !== "object" || Array.isArray(cur)) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function priorValueHash(value: number): string {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 16);
}

function numericLedgerField(row: EvidenceLedgerRow, field: string): number | null {
  const raw = row[field];
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function isNonNegativeInteger(value: number | null): value is number {
  return value !== null && value >= 0 && Number.isInteger(value);
}

function isPositiveInteger(value: number | null): value is number {
  return value !== null && value > 0 && Number.isInteger(value);
}

function malformedAcceptedRowIds(
  rows: EvidenceLedgerRow[],
  headerColumnCount: number,
  activePaths: ReadonlySet<string>,
  priors: unknown,
  sources: ReadonlyMap<string, SourceCatalogEntry>,
): string[] {
  const malformed: string[] = [];
  rows.forEach((row) => {
    if (row.status !== "accepted") return;
    const reasons: string[] = [];

    if (row.rawColumnCount !== headerColumnCount) {
      reasons.push(`column count ${row.rawColumnCount} != ${headerColumnCount}`);
    }

    const missing = REQUIRED_ACCEPTED_FIELDS.filter((field) => !row[field]);
    if (missing.length > 0) reasons.push(`missing ${missing.join("|")}`);

    const numerator = numericLedgerField(row, "numerator");
    if (!isNonNegativeInteger(numerator)) reasons.push("numerator is not a finite non-negative integer");

    const events = numericLedgerField(row, "events");
    if (!isNonNegativeInteger(events)) reasons.push("events is not a finite non-negative integer");

    const denominator = numericLedgerField(row, "denominator");
    const personDays = numericLedgerField(row, "person_days");
    const exposureTime = numericLedgerField(row, "exposure_time");
    if (personDays !== null && !isPositiveInteger(personDays)) {
      reasons.push("person_days is not a finite positive integer");
    }
    if (
      (denominator === null || denominator <= 0) &&
      !isPositiveInteger(personDays) &&
      (exposureTime === null || exposureTime <= 0)
    ) {
      reasons.push("missing finite positive denominator/person_days/exposure_time");
    }

    if (row.extractor && row.verifier && row.extractor === row.verifier) {
      reasons.push("extractor and verifier are not independent");
    }

    if (row.parameter_path && !activePaths.has(row.parameter_path)) {
      reasons.push("parameter_path is not active");
    }

    const conditionPathMatch =
      typeof row.parameter_path === "string" ? /^conditions\.([^.]+)\./.exec(row.parameter_path) : null;
    if (conditionPathMatch) {
      const activeConditionId = conditionPathMatch[1];
      if (!row.condition_id) reasons.push("missing condition_id");
      if (!row.mapped_prior_id) {
        reasons.push("missing mapped_prior_id");
      } else if (row.mapped_prior_id !== activeConditionId) {
        reasons.push(`mapped_prior_id ${row.mapped_prior_id} does not match parameter_path condition ${activeConditionId}`);
      }
    }

    const studySlug = row.study_slug;
    if (studySlug) {
      const source = sources.get(studySlug);
      if (!source) {
        reasons.push(`study_slug ${studySlug} does not resolve to source markdown`);
      } else {
        const studyDoi = optionalDoi(row.study_doi);
        if (source.doi === null && studyDoi !== null) {
          reasons.push(`study_slug ${studySlug} has no DOI in ${source.path}; found ${row.study_doi}`);
        } else if (source.doi !== null && studyDoi !== source.doi) {
          const title = source.title ? `; title: ${source.title}` : "";
          reasons.push(`study_doi ${row.study_doi ?? ""} does not match ${studySlug} (${source.doi}${title})`);
        }
      }
    }

    if (row.parameter_path && row.prior_value_hash) {
      const value = valueAtPath(priors, row.parameter_path);
      if (typeof value !== "number" || !Number.isFinite(value)) {
        reasons.push("prior_value_hash cannot be checked because active parameter value is not finite numeric");
      } else {
        const expectedHash = priorValueHash(value);
        if (row.prior_value_hash !== expectedHash) {
          reasons.push(`prior_value_hash ${row.prior_value_hash} != active ${expectedHash}`);
        }
      }
    }

    if (reasons.length > 0) {
      malformed.push(`row ${row.index}: ${reasons.join("; ")}`);
    }
  });
  return malformed;
}

export function buildEvidenceStatus(root = REPO_ROOT): EvidenceStatus {
  const ledgerPath = resolve(root, LEDGER_PATH);
  const priorsPath = resolve(root, PRIORS_PATH);
  const ledgerText = readFileSync(ledgerPath, "utf8");
  const ledgerRecords = parseCsvRecords(ledgerText);
  const headerColumnCount = ledgerRecords[0]?.values.length ?? 0;
  const ledgerRows = parseCsvRows(ledgerText);
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

  const parameterPaths = activeParameterPaths(priors, root === REPO_ROOT);
  const activePathSet = new Set(parameterPaths);
  const acceptedRows = ledgerRows.filter((row) => row.status === "accepted");
  const malformedRows = malformedAcceptedRowIds(
    ledgerRows,
    headerColumnCount,
    activePathSet,
    priors,
    sourceCatalog(root),
  );
  const malformedRowIndexes = new Set(
    malformedRows.flatMap((message) => {
      const match = /^row (\d+):/.exec(message);
      return match ? [Number(match[1])] : [];
    }),
  );
  const validAcceptedRows = acceptedRows.filter((row) => !malformedRowIndexes.has(row.index));
  const acceptedParameterPaths = new Set(
    validAcceptedRows
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
