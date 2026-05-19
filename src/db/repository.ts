import { v4 as uuid } from "uuid";
import { db, type DbCandidate, type CandidateStatus, type CriterionEntry, type Attachment } from "./schema";

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
  await db.transaction("rw", db.candidates, db.criterionEntries, db.simSessions, async () => {
    await db.candidates.delete(id);
    await db.criterionEntries.where("candidateId").equals(id).delete();
    await db.simSessions.where("candidateId").equals(id).delete();
  });
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
