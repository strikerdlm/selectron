// @vitest-environment jsdom
// RTL smoke tests for IMMValidationCompare (I5).

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { IMMValidationCompare } from "@/ui/figures/IMMValidationCompare";
import type { IMMOutcome } from "@/imm/types";

afterEach(cleanup);

vi.mock("echarts-for-react/lib/core", () => ({
  default: () => <div data-testid="echarts-mock" />,
}));

function makeSummary(mean: number, sd = 2) {
  return {
    mean, sd,
    ci90: [mean - 1.645 * sd, mean + 1.645 * sd] as [number, number],
    ci95: [mean - 1.96  * sd, mean + 1.96  * sd] as [number, number],
  };
}

function makeOutcome(tmeMean = 100, chiMean = 94.93, pEvacMean = 5.57, pLoclMean = 0.44, sd = 4): IMMOutcome {
  return {
    tme:   makeSummary(tmeMean,   sd),
    chi:   makeSummary(chiMean,   sd),
    pEvac: makeSummary(pEvacMean, sd),
    pLocl: makeSummary(pLoclMean, sd),
    missionSuccess: makeSummary(80, sd),
    perConditionDrivers: [],
    convergence: { trialCheckpoints: [], sigmaChi: [], sigmaPevac: [] },
  };
}

describe("IMMValidationCompare (I5)", () => {
  it("renders chart when outcome is provided", () => {
    const outcome = makeOutcome();
    const { container } = render(<IMMValidationCompare outcome={outcome} />);
    expect(container.querySelector("[data-testid='echarts-mock']")).not.toBeNull();
  });

  it("renders with default K15 reference when none supplied", () => {
    const outcome = makeOutcome();
    const { container } = render(<IMMValidationCompare outcome={outcome} />);
    // Caption references K15
    expect(container.textContent).toContain("K15");
  });

  it("run.tme.mean=100 vs ref.tme.mean=106: delta 6 within CI95 (sd=4 → CI95=[92.16,107.84])", () => {
    // CI95 = [100 ± 1.96*4] = [92.16, 107.84]; ref=106 is inside
    const outcome = makeOutcome(100, 94.93, 5.57, 0.44, 4);
    const { container } = render(
      <IMMValidationCompare
        outcome={outcome}
        reference={{ label: "K15 test", tme: { mean: 106 }, chi: { mean: 94.93 }, pEvac: { mean: 5.57 }, pLocl: { mean: 0.44 } }}
      />,
    );
    // Caption says "within CI₉₅" for TME (ref 106 inside [92.16, 107.84])
    expect(container.textContent).toContain("✓ within CI₉₅");
  });

  it("large mismatch case: run.tme.mean=50 vs ref.tme.mean=106 (sd=2) → outside CI95", () => {
    // CI95 = [50 ± 1.96*2] = [46.08, 53.92]; ref=106 is way outside
    const outcome = makeOutcome(50, 94.93, 5.57, 0.44, 2);
    const { container } = render(
      <IMMValidationCompare
        outcome={outcome}
        reference={{ label: "K15 test", tme: { mean: 106 }, chi: { mean: 94.93 }, pEvac: { mean: 5.57 }, pLocl: { mean: 0.44 } }}
      />,
    );
    expect(container.textContent).toContain("⚠ outside CI₉₅");
  });

  it("caption includes metric values from outcome", () => {
    const outcome = makeOutcome(103.5, 92.1, 6.2, 0.51);
    const { container } = render(<IMMValidationCompare outcome={outcome} />);
    expect(container.textContent).toContain("103.5");
  });

  it("does not throw with custom reference", () => {
    const outcome = makeOutcome();
    expect(() =>
      render(
        <IMMValidationCompare
          outcome={outcome}
          reference={{
            label: "Custom ref",
            tme:   { mean: 90 },
            chi:   { mean: 88 },
            pEvac: { mean: 8  },
            pLocl: { mean: 1  },
          }}
        />,
      ),
    ).not.toThrow();
  });
});
