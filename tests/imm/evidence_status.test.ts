import { describe, expect, it } from "vitest";
import { buildEvidenceStatus } from "../../scripts/evidence_status";

describe("evidence status gate", () => {
  it("reports current release priors as unadjudicated when accepted ledger rows are absent", () => {
    const status = buildEvidenceStatus();

    expect(status.acceptedCount).toBe(0);
    expect(status.releasePriorsAdjudicated).toBe(false);
    expect(status.status).toBe("unadjudicated");
    expect(status.proposalRefCount).toBeGreaterThan(0);
    expect(status.message).toContain("No adjudicated analog evidence release");
  });
});
