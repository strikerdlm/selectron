#!/usr/bin/env tsx
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type EvidenceStatusSnapshot = {
  acceptedCount: number;
  malformedAcceptedRows?: unknown[];
  malformedAcceptedRowCount?: number;
  proposalRefCount: number;
  activeParameterCount: number;
  acceptedCoveredParameterCount: number;
  uncoveredParameterCount: number;
  releasePriorsAdjudicated: boolean;
  status: string;
};

type ReleaseFreezeManifest = {
  generatedAt: string;
  sourceCommit: string;
  sourceDirty: boolean;
  packageVersion: string;
  priorCatalogPath: string;
  priorCatalogSha256: string;
  evidenceStatusPath: string;
  evidenceStatus: {
    status: string;
    nominalAcceptedRows: number;
    malformedAcceptedRows: number;
    validAcceptedCoverage: string;
    activeParameterCount: number;
    uncoveredParameterCount: number;
    proposalRefCount: number;
    releasePriorsAdjudicated: boolean;
  };
  claimBoundary: string;
};

const ROOT = process.cwd();
const PRIOR_PATH = "src/data/imm-priors.json";
const EVIDENCE_STATUS_PATH = "research/evidence_extracted/evidence_status.json";
const OUT_PATH = "verification-artifacts/release-freeze-manifest.json";

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(ROOT, path), "utf8")) as T;
}

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(resolve(ROOT, path))).digest("hex");
}

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function buildManifest(): ReleaseFreezeManifest {
  if (!existsSync(resolve(ROOT, PRIOR_PATH))) {
    throw new Error(`missing prior catalog at ${PRIOR_PATH}`);
  }
  if (!existsSync(resolve(ROOT, EVIDENCE_STATUS_PATH))) {
    throw new Error(`missing evidence status at ${EVIDENCE_STATUS_PATH}; run npm run evidence:status -- --write`);
  }

  const packageJson = readJson<{ version: string }>("package.json");
  const evidence = readJson<EvidenceStatusSnapshot>(EVIDENCE_STATUS_PATH);
  const malformedAcceptedRows = Array.isArray(evidence.malformedAcceptedRows)
    ? evidence.malformedAcceptedRows.length
    : evidence.malformedAcceptedRowCount ?? 0;

  return {
    generatedAt: new Date().toISOString(),
    sourceCommit: git(["rev-parse", "HEAD"]),
    sourceDirty: git(["status", "--short", "--untracked-files=no"]).length > 0,
    packageVersion: packageJson.version,
    priorCatalogPath: PRIOR_PATH,
    priorCatalogSha256: sha256File(PRIOR_PATH),
    evidenceStatusPath: EVIDENCE_STATUS_PATH,
    evidenceStatus: {
      status: evidence.status,
      nominalAcceptedRows: evidence.acceptedCount,
      malformedAcceptedRows,
      validAcceptedCoverage: `${evidence.acceptedCoveredParameterCount}/${evidence.activeParameterCount}`,
      activeParameterCount: evidence.activeParameterCount,
      uncoveredParameterCount: evidence.uncoveredParameterCount,
      proposalRefCount: evidence.proposalRefCount,
      releasePriorsAdjudicated: evidence.releasePriorsAdjudicated,
    },
    claimBoundary:
      "verification-first scenario-analysis artifact; not validated for candidate selection, absolute analog risk prediction, mission-success prediction, or medical-kit optimization",
  };
}

function validateManifest(manifest: ReleaseFreezeManifest): void {
  if (!/^[0-9a-f]{40}$/.test(manifest.sourceCommit)) {
    throw new Error(`invalid source commit: ${manifest.sourceCommit}`);
  }
  if (!/^[0-9a-f]{64}$/.test(manifest.priorCatalogSha256)) {
    throw new Error(`invalid prior hash: ${manifest.priorCatalogSha256}`);
  }
  if (manifest.evidenceStatus.activeParameterCount <= 0) {
    throw new Error("evidence status has no active parameters");
  }
  if (!manifest.evidenceStatus.validAcceptedCoverage.includes("/")) {
    throw new Error("evidence coverage is missing denominator");
  }
}

const manifest = buildManifest();
validateManifest(manifest);

if (process.argv.includes("--write")) {
  const out = resolve(ROOT, OUT_PATH);
  mkdirSync(resolve(ROOT, "verification-artifacts"), { recursive: true });
  writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`wrote ${OUT_PATH}`);
} else {
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
}
