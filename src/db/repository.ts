import { v4 as uuid } from "uuid";
import { db, type DbCandidate, type CandidateStatus, type CriterionEntry } from "./schema";

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
