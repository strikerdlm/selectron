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
  releasePriorsAdjudicated: boolean;
  status: "adjudicated" | "unadjudicated";
  message: string;
};

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LEDGER_PATH = "research/evidence_extracted/evidence_ledger.csv";
const PRIORS_PATH = "src/data/imm-priors.json";

function parseCsvRows(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] ?? "").trim();
    });
    return row;
  });
}

export function buildEvidenceStatus(root = REPO_ROOT): EvidenceStatus {
  const ledgerPath = resolve(root, LEDGER_PATH);
  const priorsPath = resolve(root, PRIORS_PATH);
  const ledgerRows = parseCsvRows(readFileSync(ledgerPath, "utf8"));
  const acceptedCount = ledgerRows.filter((row) => row.status === "accepted").length;
  const proposalCount = ledgerRows.filter((row) => row.status === "proposal").length;

  const priors = JSON.parse(readFileSync(priorsPath, "utf8")) as {
    conditions?: Record<string, { source_ref?: string }>;
  };
  const proposalRefConditionIds = Object.entries(priors.conditions ?? {})
    .filter(([, prior]) => /proposals_p-/i.test(prior.source_ref ?? ""))
    .map(([conditionId]) => conditionId)
    .sort();

  const releasePriorsAdjudicated =
    acceptedCount > 0 && proposalRefConditionIds.length === 0;

  return {
    ledgerPath: LEDGER_PATH,
    priorsPath: PRIORS_PATH,
    acceptedCount,
    proposalCount,
    proposalRefCount: proposalRefConditionIds.length,
    proposalRefConditionIds,
    releasePriorsAdjudicated,
    status: releasePriorsAdjudicated ? "adjudicated" : "unadjudicated",
    message: releasePriorsAdjudicated
      ? "Release priors are backed by accepted evidence ledger rows."
      : "No adjudicated analog evidence release is available; proposal-stage references remain exploratory.",
  };
}

function main(): number {
  const status = buildEvidenceStatus();
  const json = JSON.stringify(status, null, 2);
  if (process.argv.includes("--write")) {
    writeFileSync(resolve(REPO_ROOT, "research/evidence_extracted/evidence_status.json"), `${json}\n`);
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
