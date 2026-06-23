import { v4 as uuid } from "uuid";
import {
  db,
  type DbCandidate,
  type CandidateStatus,
  type CriterionEntry,
  type Attachment,
  type SimSession,
  SCHEMA_VERSION,
} from "./schema";
import type { IMMSession } from "@/imm/types";

export type CreateCandidateInput = {
  alias: string;
  fullName?: string;
  notes?: string;
};

export async function createCandidate(input: CreateCandidateInput): Promise<DbCandidate> {
  const now = new Date().toISOString();
  const row: DbCandidate = {
    id: uuid(),
    alias: input.alias,
    fullName: input.fullName,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
    status: "draft",
  };
  await db.candidates.add(row);
  return row;
}

export async function listCandidates(
  filter?: { status?: CandidateStatus },
): Promise<DbCandidate[]> {
  let rows = await db.candidates.toArray();
  if (filter?.status) rows = rows.filter((r) => r.status === filter.status);
  rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return rows;
}

export async function updateCandidate(
  id: string,
  patch: Partial<Omit<DbCandidate, "id" | "createdAt">>,
): Promise<DbCandidate> {
  const existing = await db.candidates.get(id);
  if (!existing) throw new Error(`Candidate ${id} not found`);
  const next: DbCandidate = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await db.candidates.put(next);
  return next;
}

export async function deleteCandidate(id: string): Promise<void> {
  await db.transaction(
    "rw",
    [db.candidates, db.criterionEntries, db.simSessions, db.immSessions, db.attachments],
    async () => {
      // Collect attachment ids referenced by this candidate's entries before deletion.
      const entries = await db.criterionEntries.where("candidateId").equals(id).toArray();
      const attachmentIds = Array.from(
        new Set(entries.flatMap((e) => e.attachmentKeys ?? [])),
      );

      await db.candidates.delete(id);
      await db.criterionEntries.where("candidateId").equals(id).delete();
      await db.simSessions.where("candidateId").equals(id).delete();
      await db.immSessions.where("candidateId").equals(id).delete();

      // For each attachment that was referenced by the deleted entries, check
      // whether any OTHER entry (from a different candidate) still references it.
      // Delete the BLOB row only if no remaining entry holds a reference.
      for (const attId of attachmentIds) {
        const stillReferenced = await db.criterionEntries
          .filter((e) => (e.attachmentKeys ?? []).includes(attId))
          .count();
        if (stillReferenced === 0) {
          await db.attachments.delete(attId);
        }
      }
    },
  );
}

export type UpsertCriterionEntryInput = Omit<CriterionEntry, "id" | "updatedAt" | "attachmentKeys"> & {
  id?: string;
  attachmentKeys?: string[];
};

export async function upsertCriterionEntry(
  input: UpsertCriterionEntryInput,
): Promise<CriterionEntry> {
  const existing = await db.criterionEntries
    .where("[candidateId+criterionId]")
    .equals([input.candidateId, input.criterionId])
    .first();

  const now = new Date().toISOString();
  const row: CriterionEntry = {
    id: existing?.id ?? input.id ?? uuid(),
    candidateId: input.candidateId,
    criterionId: input.criterionId,
    rawValue: input.rawValue,
    unit: input.unit,
    instrument: input.instrument,
    measurementDate: input.measurementDate,
    citationDoi: input.citationDoi,
    citationUrl: input.citationUrl,
    citationFree: input.citationFree,
    notes: input.notes,
    attachmentKeys: input.attachmentKeys ?? existing?.attachmentKeys ?? [],
    updatedAt: now,
  };
  await db.criterionEntries.put(row);
  return row;
}

export async function listCriterionEntries(candidateId: string): Promise<CriterionEntry[]> {
  return db.criterionEntries.where("candidateId").equals(candidateId).toArray();
}

export type CandidateBundle = {
  candidate: DbCandidate;
  criterionEntries: CriterionEntry[];
};

export async function getCandidateWithEvidence(id: string): Promise<CandidateBundle> {
  const candidate = await db.candidates.get(id);
  if (!candidate) throw new Error(`Candidate ${id} not found`);
  const criterionEntries = await db.criterionEntries.where("candidateId").equals(id).toArray();
  return { candidate, criterionEntries };
}

async function sha256Hex(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function attachFile(file: File, criterionEntryId: string): Promise<Attachment> {
  const sha = await sha256Hex(file);
  return db.transaction("rw", db.attachments, db.criterionEntries, async () => {
    let row = await db.attachments.where("sha256").equals(sha).first();
    if (!row) {
      row = {
        id: uuid(),
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        blob: file,
        sha256: sha,
        uploadedAt: new Date().toISOString(),
      };
      await db.attachments.add(row);
    }
    const entry = await db.criterionEntries.get(criterionEntryId);
    if (!entry) throw new Error(`CriterionEntry ${criterionEntryId} not found`);
    if (!entry.attachmentKeys.includes(row.id)) {
      entry.attachmentKeys.push(row.id);
      entry.updatedAt = new Date().toISOString();
      await db.criterionEntries.put(entry);
    }
    return row;
  });
}

export async function detachFile(attachmentId: string, criterionEntryId: string): Promise<void> {
  await db.transaction("rw", db.attachments, db.criterionEntries, async () => {
    const entry = await db.criterionEntries.get(criterionEntryId);
    if (entry) {
      entry.attachmentKeys = entry.attachmentKeys.filter((k) => k !== attachmentId);
      entry.updatedAt = new Date().toISOString();
      await db.criterionEntries.put(entry);
    }
    const refsRemaining = await db.criterionEntries
      .filter((e) => e.attachmentKeys.includes(attachmentId))
      .count();
    if (refsRemaining === 0) {
      await db.attachments.delete(attachmentId);
    }
  });
}

// ---------------------------------------------------------------------------
// SimSession CRUD
// ---------------------------------------------------------------------------

export async function saveSimSession(
  input: Omit<SimSession, "id" | "runAt">,
): Promise<SimSession> {
  const row: SimSession = {
    ...input,
    id: uuid(),
    runAt: new Date().toISOString(),
  };
  await db.simSessions.add(row);
  return row;
}

export async function recentSimsFor(candidateId: string, limit = 10): Promise<SimSession[]> {
  const rows = await db.simSessions.where("candidateId").equals(candidateId).toArray();
  rows.sort((a, b) => b.runAt.localeCompare(a.runAt));
  return rows.slice(0, limit);
}

// ---------------------------------------------------------------------------
// IMMSession CRUD (IMM-38, v3 schema)
// ---------------------------------------------------------------------------
//
// The `immSessions` table persists Crew Composition runs from the IMM
// Calculator (see src/imm/types.ts). The row type IS `IMMSession` verbatim —
// no DbIMMSession wrapper. Indexed columns (declared in schema.ts v3):
//   id, candidateId, createdAt, mission.id
//
// candidateId is `string | null` — `null` represents an ad-hoc crew that is
// not tied to a Stage A candidate. Dexie 4 does not index `null`/`undefined`
// values, so `.where("candidateId").equals(null)` returns nothing reliably;
// the ad-hoc-crew filter path therefore uses an in-memory `.filter()` over
// `toArray()` (acceptable: this table is small — one row per crew sim run).

export async function createIMMSession(
  input: Omit<IMMSession, "id" | "createdAt">,
): Promise<string> {
  const row: IMMSession = {
    ...input,
    id: uuid(),
    createdAt: new Date().toISOString(),
  };
  await db.immSessions.add(row);
  return row.id;
}

export async function getIMMSession(id: string): Promise<IMMSession | null> {
  const row = await db.immSessions.get(id);
  return row ?? null;
}

export async function listIMMSessions(
  opts?: { candidateId?: string | null; missionId?: string; limit?: number },
): Promise<IMMSession[]> {
  let rows: IMMSession[];
  // Use the indexed paths when possible; fall back to in-memory filter for
  // the ad-hoc-crew (candidateId === null) case, which Dexie 4 does not index.
  if (opts?.candidateId === null) {
    rows = await db.immSessions.toArray();
    rows = rows.filter((r) => r.candidateId === null);
  } else if (typeof opts?.candidateId === "string") {
    rows = await db.immSessions.where("candidateId").equals(opts.candidateId).toArray();
  } else {
    rows = await db.immSessions.toArray();
  }
  if (opts?.missionId !== undefined) {
    // Use the nested-key index when no candidateId filter is in play; otherwise
    // narrow the already-filtered set in memory.
    if (opts.candidateId === undefined) {
      rows = await db.immSessions.where("mission.id").equals(opts.missionId).toArray();
    } else {
      rows = rows.filter((r) => r.mission.id === opts.missionId);
    }
  }
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (typeof opts?.limit === "number") rows = rows.slice(0, opts.limit);
  return rows;
}

export async function updateIMMSession(
  id: string,
  patch: Partial<Omit<IMMSession, "id" | "createdAt">>,
): Promise<void> {
  const existing = await db.immSessions.get(id);
  if (!existing) throw new Error(`IMMSession ${id} not found`);
  const next: IMMSession = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
  };
  await db.immSessions.put(next);
}

export async function deleteIMMSession(id: string): Promise<void> {
  // Silent on not-found, matching the existing saveSimSession/delete convention.
  await db.immSessions.delete(id);
}

export async function recentIMMSessionsFor(
  candidateId: string,
  limit = 10,
): Promise<IMMSession[]> {
  return listIMMSessions({ candidateId, limit });
}

// ---------------------------------------------------------------------------
// JSON export / import
// ---------------------------------------------------------------------------

export type DbDump = {
  schemaVersion: number;
  candidates: DbCandidate[];
  criterionEntries: CriterionEntry[];
  attachments: Array<Omit<Attachment, "blob"> & { blobBase64: string }>;
  simSessions: SimSession[];
  immSessions: IMMSession[];
};

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToBlob(b64: string, mime: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function exportDb(): Promise<DbDump> {
  const [candidates, criterionEntries, simSessions, immSessions, attachments] = await Promise.all([
    db.candidates.toArray(),
    db.criterionEntries.toArray(),
    db.simSessions.toArray(),
    db.immSessions.toArray(),
    db.attachments.toArray(),
  ]);
  const encodedAttachments = await Promise.all(
    attachments.map(async (a) => ({
      id: a.id,
      filename: a.filename,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      sha256: a.sha256,
      uploadedAt: a.uploadedAt,
      blobBase64: await blobToBase64(a.blob),
    })),
  );
  return {
    schemaVersion: SCHEMA_VERSION,
    candidates,
    criterionEntries,
    simSessions,
    immSessions,
    attachments: encodedAttachments,
  };
}

export async function importDb(dump: DbDump): Promise<void> {
  if (dump.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(
      `Import schema ${dump.schemaVersion} != current ${SCHEMA_VERSION}; migration needed`,
    );
  }
  await db.transaction(
    "rw",
    [db.candidates, db.criterionEntries, db.simSessions, db.immSessions, db.attachments],
    async () => {
      await db.candidates.clear();
      await db.criterionEntries.clear();
      await db.simSessions.clear();
      await db.immSessions.clear();
      await db.attachments.clear();
      await db.candidates.bulkAdd(dump.candidates);
      await db.criterionEntries.bulkAdd(dump.criterionEntries);
      await db.simSessions.bulkAdd(dump.simSessions);
      await db.immSessions.bulkAdd(dump.immSessions ?? []);
      const restoredAttachments = dump.attachments.map((a) => ({
        id: a.id,
        filename: a.filename,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
        sha256: a.sha256,
        uploadedAt: a.uploadedAt,
        blob: base64ToBlob(a.blobBase64, a.mimeType),
      }));
      await db.attachments.bulkAdd(restoredAttachments);
    },
  );
}
