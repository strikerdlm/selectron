// tests/imm/provenance.test.ts
//
// F3/F4: locks the session/exports provenance helpers. The SHA-256 helpers
// must be deterministic so a reloaded session can detect prior/multiplier
// drift, and the evidence-coverage statement must report the operative
// 0/4,846 fact and the "variability, not calibration" disclaimer.

import { describe, it, expect } from "vitest";
import {
  EVIDENCE_COVERAGE_STATEMENT,
  EVIDENCE_STATUS_SNAPSHOT,
  sha256Hex,
  computePriorsHash,
  computeKindMultiplierHash,
} from "../../src/imm/provenance";

describe("provenance — SHA-256 helpers (F3)", () => {
  it("sha256Hex is deterministic and matches the known digest of 'abc'", async () => {
    const a = await sha256Hex("abc");
    const b = await sha256Hex("abc");
    expect(a).toBe(b);
    // Known SHA-256("abc") test vector.
    expect(a).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("sha256Hex distinguishes different inputs", async () => {
    const a = await sha256Hex("selectron-v0.6");
    const b = await sha256Hex("selectron-v0.7");
    expect(a).not.toBe(b);
  });

  it("computePriorsHash is stable across calls (deterministic canonical JSON)", async () => {
    const a = await computePriorsHash();
    const b = await computePriorsHash();
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("computeKindMultiplierHash is stable across calls", async () => {
    const a = await computeKindMultiplierHash();
    const b = await computeKindMultiplierHash();
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("priors and kind-multiplier hashes differ (different content)", async () => {
    const p = await computePriorsHash();
    const k = await computeKindMultiplierHash();
    expect(p).not.toBe(k);
  });
});

describe("provenance — evidence coverage statement (F4)", () => {
  it("EVIDENCE_STATUS_SNAPSHOT reports the operative 0 / 4,846 coverage", () => {
    expect(EVIDENCE_STATUS_SNAPSHOT.acceptedCount).toBe(0);
    expect(EVIDENCE_STATUS_SNAPSHOT.acceptedCoveredParameterCount).toBe(0);
    expect(EVIDENCE_STATUS_SNAPSHOT.activeParameterCount).toBe(4846);
    expect(EVIDENCE_STATUS_SNAPSHOT.releasePriorsAdjudicated).toBe(false);
    expect(EVIDENCE_STATUS_SNAPSHOT.status).toBe("unadjudicated");
  });

  it("EVIDENCE_COVERAGE_STATEMENT states the coverage fact and the variability disclaimer", () => {
    expect(EVIDENCE_COVERAGE_STATEMENT).toContain("0 / 4846");
    expect(EVIDENCE_COVERAGE_STATEMENT).toContain("unadjudicated");
    expect(EVIDENCE_COVERAGE_STATEMENT).toContain("Monte Carlo");
    expect(EVIDENCE_COVERAGE_STATEMENT.toLowerCase()).toContain("not establish empirical calibration");
  });
});