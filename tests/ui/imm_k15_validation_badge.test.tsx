// @vitest-environment jsdom
// IMM-46 — RTL tests for the K15 reference-model benchmark badge in CrewComposition.
//
// The badge is rendered as a subcomponent so it can be unit-tested directly
// with crafted props (no need to mock Worker, Dexie, or ECharts).
//
// Coverage:
//   (a) renders when mission=iss-6mo, kit ∈ {none|issHMS|unlimited}, outcome defined
//   (b) hides for non-K15 missions (e.g. mdrs-2wk)
//   (c) hides when outcome is undefined (pre-sim)
//   (d) hides for custom kit (no K15 anchor)
//   (e) within-CI₉₅ outcome → all four metrics flagged ✓
//   (f) out-of-CI₉₅ outcome on one metric → that metric ✗, others remain ✓

import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { K15ValidationBadge } from "@/ui/views/CrewComposition";
import type { IMMOutcome } from "@/imm/types";

afterEach(cleanup);

function makeSummary(mean: number, sd = 2) {
  return {
    mean, sd,
    ci90: [mean - 1.645 * sd, mean + 1.645 * sd] as [number, number],
    ci95: [mean - 1.96  * sd, mean + 1.96  * sd] as [number, number],
  };
}

function makeOutcome(
  tmeMean = 106,
  chiMean = 94.93,
  pEvacMean = 5.57,
  pLoclMean = 0.44,
): IMMOutcome {
  return {
    tme:   makeSummary(tmeMean,   4),
    chi:   makeSummary(chiMean,   4),
    pEvac: makeSummary(pEvacMean, 0.5),
    pLocl: makeSummary(pLoclMean, 0.05),
    missionSuccess: makeSummary(80, 4),
    perConditionDrivers: [],
    convergence: { trialCheckpoints: [], sigmaChi: [], sigmaPevac: [] },
  };
}

describe("K15ValidationBadge (IMM-46)", () => {
  it("(a) renders badge for iss-6mo + issHMS scenario when outcome is present", () => {
    const outcome = makeOutcome();
    const { container, queryByText } = render(
      <K15ValidationBadge
        outcome={outcome}
        missionId="iss-6mo"
        kitScenarioId="issHMS"
      />,
    );
    expect(queryByText(/K15 Table 1 reference-model benchmark/i)).not.toBeNull();
    expect(queryByText(/issHMS scenario/i)).not.toBeNull();
    // All 4 metric rows present
    expect(container.querySelector("[data-testid='k15-badge-row-TME']")).not.toBeNull();
    expect(container.querySelector("[data-testid='k15-badge-row-CHI']")).not.toBeNull();
    expect(container.querySelector("[data-testid='k15-badge-row-pEVAC']")).not.toBeNull();
    expect(container.querySelector("[data-testid='k15-badge-row-pLOCL']")).not.toBeNull();
  });

  it("(b) hides badge for non-K15 missions (mdrs-2wk)", () => {
    const outcome = makeOutcome();
    const { container } = render(
      <K15ValidationBadge
        outcome={outcome}
        missionId="mdrs-2wk"
        kitScenarioId="issHMS"
      />,
    );
    expect(container.textContent).toBe("");
    expect(container.querySelector("[data-testid='k15-badge-row-TME']")).toBeNull();
  });

  it("(c) hides badge when outcome is undefined (pre-sim)", () => {
    const { container } = render(
      <K15ValidationBadge
        outcome={undefined}
        missionId="iss-6mo"
        kitScenarioId="issHMS"
      />,
    );
    expect(container.textContent).toBe("");
  });

  it("(d) hides badge for custom kit (no K15 anchor)", () => {
    const outcome = makeOutcome();
    const { container } = render(
      <K15ValidationBadge
        outcome={outcome}
        missionId="iss-6mo"
        kitScenarioId="custom"
      />,
    );
    expect(container.textContent).toBe("");
  });

  it("(e) within-CI₉₅ outcome (matches issHMS reference exactly) → all metrics ✓", () => {
    // issHMS reference: TME=106, CHI=94.93, pEVAC=5.57, pLOCL=0.44.
    // Use the exact reference values → all rows inside CI₉₅.
    const outcome = makeOutcome(106, 94.93, 5.57, 0.44);
    const { container } = render(
      <K15ValidationBadge
        outcome={outcome}
        missionId="iss-6mo"
        kitScenarioId="issHMS"
      />,
    );
    // 4 rows × ✓ glyph (rendered with text-go class)
    const goSpans = container.querySelectorAll("span.text-go");
    expect(goSpans.length).toBe(4);
    // No ✗/warn flags
    const warnSpans = container.querySelectorAll("span.text-warn");
    expect(warnSpans.length).toBe(0);
    // Glyph content
    const checks = Array.from(goSpans).map((s) => s.textContent);
    expect(checks.every((t) => t === "✓")).toBe(true);
  });

  it("(f) out-of-CI₉₅ TME (run=200 vs issHMS CI₉₅=[87,126]) → TME ✗, others ✓", () => {
    // TME=200 is far outside [87, 126]; other metrics match the reference.
    const outcome = makeOutcome(200, 94.93, 5.57, 0.44);
    const { container } = render(
      <K15ValidationBadge
        outcome={outcome}
        missionId="iss-6mo"
        kitScenarioId="issHMS"
      />,
    );
    // 3 of the 4 metric flags should be ✓ (CHI, pEVAC, pLOCL)
    const goSpans = container.querySelectorAll("span.text-go");
    expect(goSpans.length).toBe(3);
    // 1 of the 4 should be ✗ (TME)
    const warnSpans = container.querySelectorAll("span.text-warn");
    expect(warnSpans.length).toBe(1);
    expect(warnSpans[0].textContent).toBe("✗");

    // The ✗ flag must be inside the TME row specifically
    const tmeRow = container.querySelector("[data-testid='k15-badge-row-TME']") as HTMLElement;
    expect(tmeRow).not.toBeNull();
    expect(tmeRow.querySelector("span.text-warn")).not.toBeNull();
    expect(tmeRow.querySelector("span.text-go")).toBeNull();

    // And the other rows must each still carry a ✓
    for (const label of ["CHI", "pEVAC", "pLOCL"] as const) {
      const row = container.querySelector(`[data-testid='k15-badge-row-${label}']`) as HTMLElement;
      expect(row.querySelector("span.text-go")).not.toBeNull();
      expect(row.querySelector("span.text-warn")).toBeNull();
    }
  });

  it("renders correct CI₉₅ comparison for 'none' scenario (TME 73-122)", () => {
    // none-scenario TME mean 98.3, CI₉₅ [73, 122]; pick value 70 → outside, ✗
    const outcome = makeOutcome(70, 59.2, 66.9, 2.89);
    const { container } = render(
      <K15ValidationBadge
        outcome={outcome}
        missionId="iss-6mo"
        kitScenarioId="none"
      />,
    );
    // TME=70 is outside [73, 122] → ✗
    const tmeRow = container.querySelector("[data-testid='k15-badge-row-TME']") as HTMLElement;
    expect(tmeRow.querySelector("span.text-warn")).not.toBeNull();
    // Other three metrics match the 'none' reference → ✓
    const goSpans = container.querySelectorAll("span.text-go");
    expect(goSpans.length).toBe(3);
  });

  it("renders correct CI₉₅ comparison for 'unlimited' scenario (pEVAC 4.80-5.07)", () => {
    // unlimited-scenario pEVAC mean 4.93, CI₉₅ [4.80, 5.07]; value 4.93 → inside ✓
    const outcome = makeOutcome(106, 94.98, 4.93, 0.45);
    const { container } = render(
      <K15ValidationBadge
        outcome={outcome}
        missionId="iss-6mo"
        kitScenarioId="unlimited"
      />,
    );
    const goSpans = container.querySelectorAll("span.text-go");
    expect(goSpans.length).toBe(4);
    const warnSpans = container.querySelectorAll("span.text-warn");
    expect(warnSpans.length).toBe(0);
  });
});
