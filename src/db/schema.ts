import Dexie, { type EntityTable } from "dexie";

export type CandidateStatus = "draft" | "ready";

export type Candidate = {
  id: string;
  alias: string;
  fullName?: string;
  createdAt: string;
  updatedAt: string;
  status: CandidateStatus;
  notes?: string;
  photoBlobKey?: string;
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

import type { RiskPosterior } from "@/types/risk";

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

export const SCHEMA_VERSION = 1;

export class SelectronDb extends Dexie {
  candidates!: EntityTable<Candidate, "id">;
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
  }
}

export const db = new SelectronDb();
