// @vitest-environment jsdom
// RTL smoke tests for IMMConditionDrivers (I3).
// ECharts does not render meaningfully in jsdom; tests assert on wrapper DOM,
// the caption text, and the metric-toggle button group.

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { IMMConditionDrivers } from "@/ui/figures/IMMConditionDrivers";
import type { IMMOutcome } from "@/imm/types";

afterEach(cleanup);

vi.mock("echarts-for-react/lib/core", () => ({
  default: ({ option }: { option: unknown }) => (
    <div
      data-testid="echarts-mock"
      data-series-count={
        Array.isArray((option as { series?: unknown[] }).series)
          ? (option as { series: unknown[] }).series.length
          : 0
      }
    />
  ),
}));

function makeSummary(mean: number, sd = 2) {
  return {
    mean,
    sd,
    ci90: [mean - 1.645 * sd, mean + 1.645 * sd] as [number, number],
    ci95: [mean - 1.96 * sd, mean + 1.96 * sd] as [number, number],
  };
}

type DriverInput = {
  conditionId: string;
  pEvacContrib: number;
  pLoclContrib: number;
  tmeContrib?: number;
};

function makeOutcome(drivers: DriverInput[]): IMMOutcome {
  return {
    tme: makeSummary(106),
    chi: makeSummary(94.93),
    pEvac: makeSummary(5.57),
    pLocl: makeSummary(0.44),
    missionSuccess: makeSummary(80),
    perConditionDrivers: drivers.map((d) => ({
      conditionId: d.conditionId,
      pEvacContrib: d.pEvacContrib,
      pLoclContrib: d.pLoclContrib,
      tmeContrib: d.tmeContrib ?? 0,
    })),
    convergence: { trialCheckpoints: [], sigmaChi: [], sigmaPevac: [] },
  };
}

// Real IDs verified against src/imm/conditions.ts. Values are intentionally
// non-summing-to-100 so a normalizing implementation would fail the assertions.
const DRIVERS: DriverInput[] = [
  { conditionId: "nephrolithiasis",            pEvacContrib: 1.20, pLoclContrib: 0.04 },
  { conditionId: "dental-abscess",             pEvacContrib: 0.85, pLoclContrib: 0.01 },
  { conditionId: "back-injury",                pEvacContrib: 0.62, pLoclContrib: 0.02 },
  { conditionId: "acute-sinusitis",            pEvacContrib: 0.55, pLoclContrib: 0.00 },
  { conditionId: "altitude-sickness",          pEvacContrib: 0.40, pLoclContrib: 0.05 },
  { conditionId: "barotrauma-ear-sinus-block", pEvacContrib: 0.31, pLoclContrib: 0.00 },
  { conditionId: "headache-co2-induced",       pEvacContrib: 0.20, pLoclContrib: 0.01 },
  { conditionId: "anxiety",                    pEvacContrib: 0.10, pLoclContrib: 0.00 },
];

describe("IMMConditionDrivers (I3)", () => {
  it("renders chart when outcome has drivers", () => {
    const outcome = makeOutcome(DRIVERS);
    const { container } = render(
      <IMMConditionDrivers
        outcome={outcome}
        trials={100_000}
        seed={0xc0ffee}
        mission={{ id: "iss-6mo", label: "ISS 6-month" }}
      />,
    );
    expect(container.querySelector("[data-testid='echarts-mock']")).not.toBeNull();
  });

  it("renders empty-state placeholder when perConditionDrivers is empty", () => {
    const outcome = makeOutcome([]);
    const { container, queryByTestId } = render(
      <IMMConditionDrivers
        outcome={outcome}
        trials={100_000}
        seed={0xc0ffee}
        mission={{ id: "iss-6mo", label: "ISS 6-month" }}
      />,
    );
    expect(queryByTestId("echarts-mock")).toBeNull();
    expect(container.textContent).toMatch(/no driver data/i);
  });

  it("respects topN — only top N items appear in the caption count", () => {
    const outcome = makeOutcome(DRIVERS); // 8 drivers
    const { container } = render(
      <IMMConditionDrivers
        outcome={outcome}
        trials={50_000}
        seed={0xc0ffee}
        mission={{ id: "iss-6mo", label: "ISS 6-month" }}
        topN={3}
      />,
    );
    expect(container.textContent).toMatch(/Top 3 of 10[01] conditions/i);
  });

  it("caption mentions the active metric (default pEVAC)", () => {
    const outcome = makeOutcome(DRIVERS);
    const { container } = render(
      <IMMConditionDrivers
        outcome={outcome}
        trials={100_000}
        seed={0xc0ffee}
        mission={{ id: "iss-6mo", label: "ISS 6-month" }}
      />,
    );
    expect(container.textContent).toContain("pEVAC");
  });

  it("metric toggle: clicking pLOCL updates the caption to mention pLOCL", () => {
    const outcome = makeOutcome(DRIVERS);
    const { container, getByRole } = render(
      <IMMConditionDrivers
        outcome={outcome}
        trials={100_000}
        seed={0xc0ffee}
        mission={{ id: "iss-6mo", label: "ISS 6-month" }}
      />,
    );
    // Default caption mentions pEVAC and leads with Nephrolithiasis (highest pEvacContrib)
    expect(container.textContent).toMatch(/driving pEVAC/i);

    const pLoclBtn = getByRole("button", { name: /pLocl/i });
    fireEvent.click(pLoclBtn);

    // After toggle, the caption references pLOCL and the new leader is Altitude Sickness
    // (highest pLoclContrib=0.05 in the fixture).
    expect(container.textContent).toMatch(/driving pLOCL/i);
    expect(container.textContent).toContain("Altitude Sickness");
  });

  it("uses friendly condition labels rather than raw kebab-case IDs", () => {
    const outcome = makeOutcome(DRIVERS);
    const { container } = render(
      <IMMConditionDrivers
        outcome={outcome}
        trials={100_000}
        seed={0xc0ffee}
        mission={{ id: "iss-6mo", label: "ISS 6-month" }}
        topN={5}
      />,
    );
    // Caption "leaders" should list friendly labels, not the raw id.
    expect(container.textContent).toContain("Nephrolithiasis");
    // Bare id "nephrolithiasis" (lowercase, hyphenated style) should not leak
    // into the human-readable leaders list — caption uses the friendly label.
    const text = container.textContent ?? "";
    const leadersMatch = text.match(/leaders: ([^.]+)\./);
    expect(leadersMatch).not.toBeNull();
    if (leadersMatch) {
      expect(leadersMatch[1]).not.toContain("nephrolithiasis");
    }
  });

  it("falls back to the raw id when a conditionId is not in the IMM catalog", () => {
    const bogus: DriverInput[] = [
      { conditionId: "not-a-real-condition", pEvacContrib: 2.0, pLoclContrib: 0.0 },
      { conditionId: "nephrolithiasis",      pEvacContrib: 1.0, pLoclContrib: 0.0 },
    ];
    const outcome = makeOutcome(bogus);
    const { container } = render(
      <IMMConditionDrivers
        outcome={outcome}
        trials={100_000}
        seed={0xc0ffee}
        mission={{ id: "iss-6mo", label: "ISS 6-month" }}
        topN={5}
      />,
    );
    // The unknown id appears in the leaders verbatim (no friendly label exists).
    expect(container.textContent).toContain("not-a-real-condition");
    // Chart still renders (does not throw on missing family color).
    expect(container.querySelector("[data-testid='echarts-mock']")).not.toBeNull();
  });

  it("treats an all-zero contribution set as the empty state", () => {
    const allZero: DriverInput[] = [
      { conditionId: "nephrolithiasis", pEvacContrib: 0, pLoclContrib: 0 },
      { conditionId: "dental-abscess",  pEvacContrib: 0, pLoclContrib: 0 },
    ];
    const outcome = makeOutcome(allZero);
    const { container, queryByTestId } = render(
      <IMMConditionDrivers
        outcome={outcome}
        trials={100_000}
        seed={0xc0ffee}
        mission={{ id: "iss-6mo", label: "ISS 6-month" }}
      />,
    );
    expect(queryByTestId("echarts-mock")).toBeNull();
    expect(container.textContent).toMatch(/no driver data/i);
  });
});
