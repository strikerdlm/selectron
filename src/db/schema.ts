import Dexie, { type EntityTable } from "dexie";
import type { RiskPosterior } from "@/types/risk";
import type { AccessTier } from "@/types/scenario";

export type CandidateStatus = "draft" | "ready";

export type DbCandidate = {
  id: string;
  alias: string;
  fullName?: string;
  createdAt: string;
  updatedAt: string;
  status: CandidateStatus;
  notes?: string;
  photoBlobKey?: string;
  /** scope-expansion-3 (Task 92): accessibility tier set at candidate creation. */
  accessTier?: AccessTier;
};

export type CriterionEntry = {
  id: string;
  candidateId: string;
  criterionId: string;
  rawValue: number;
  unit?: string;
  instrument?: string;
  measurementDate?: string;
  citationDoi?: string;
  citationUrl?: string;
  citationFree?: string;
  notes?: string;
  attachmentKeys: string[];
  updatedAt: string;
};

export type Attachment = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  blob: Blob;
  sha256: string;
  uploadedAt: string;
};

export type SimSession = {
  id: string;
  candidateId: string;
  missionId: string;
  runAt: string;
  trials: number;
  chiStar: number;
  seed: number;
  priorsVersion: string;
  posterior: RiskPosterior;
  chiSamples: number[];
  qtlSamples: number[];
  notes?: string;
};

export type PriorsCacheEntry = {
  id: "active";
  priorsVersion: string;
  loadedAt: string;
};

export type MetaEntry = {
  id: "version";
  schemaVersion: number;
};

export const SCHEMA_VERSION = 2;

export class SelectronDb extends Dexie {
  candidates!: EntityTable<DbCandidate, "id">;
  criterionEntries!: EntityTable<CriterionEntry, "id">;
  attachments!: EntityTable<Attachment, "id">;
  simSessions!: EntityTable<SimSession, "id">;
  priorsCache!: EntityTable<PriorsCacheEntry, "id">;
  _meta!: EntityTable<MetaEntry, "id">;

  constructor() {
    super("selectron");
    this.version(1).stores({
      candidates: "id, alias, createdAt, updatedAt, status",
      criterionEntries: "id, candidateId, criterionId, [candidateId+criterionId], updatedAt",
      attachments: "id, sha256, uploadedAt",
      simSessions: "id, candidateId, missionId, runAt, [candidateId+missionId]",
      priorsCache: "id",
      _meta: "id",
    });
    // v2 (scope-expansion-3, 2026-05-19): adds DbCandidate.accessTier.
    // The schema declaration is the same — no new indexed column. Existing rows
    // are valid as-is (accessTier is optional). Upgrade hook is a no-op but
    // exists so Dexie bumps the version cleanly.
    this.version(SCHEMA_VERSION).stores({
      candidates: "id, alias, createdAt, updatedAt, status",
      criterionEntries: "id, candidateId, criterionId, [candidateId+criterionId], updatedAt",
      attachments: "id, sha256, uploadedAt",
      simSessions: "id, candidateId, missionId, runAt, [candidateId+missionId]",
      priorsCache: "id",
      _meta: "id",
    });
  }
}

export const db = new SelectronDb();
