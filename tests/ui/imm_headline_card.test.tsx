// @vitest-environment jsdom
// RTL smoke tests for IMMHeadlineCard (I1).
// ECharts does not render meaningfully in jsdom; the sparkline is mocked.

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { IMMHeadlineCard } from "@/ui/figures/IMMHeadlineCard";
import { RAF_TREATMENT_MODEL_DISCLOSURE } from "@/imm/treatment";
import type { AnalogFieldExposureDisclosure, IMMOutcome } from "@/imm/types";

afterEach(cleanup);

vi.mock("echarts-for-react/lib/core", () => ({
  default: () => <div data-testid="echarts-mock" />,
}));

function makeSummary(mean: number, sd = 2) {
  return {
    mean,
    sd,
    ci90: [mean - 1.645 * sd, mean + 1.645 * sd] as [number, number],
    ci95: [mean - 1.96 * sd, mean + 1.96 * sd] as [number, number],
  };
}

function makeOutcome(opts?: {
  tme?: number;
  chi?: number;
  pEvac?: number;
  pLocl?: number;
  msp?: number;
  sd?: number;
  checkpoints?: number[];
  sigmaChi?: number[];
  sigmaPevac?: number[];
}): IMMOutcome {
  const sd = opts?.sd ?? 2;
  return {
    tme:   makeSummary(opts?.tme   ?? 106,    sd),
    chi:   makeSummary(opts?.chi   ?? 94.93,  sd),
    pEvac: makeSummary(opts?.pEvac ?? 5.57,   sd),
    pLocl: makeSummary(opts?.pLocl ?? 0.44,   sd),
    missionSuccess: makeSummary(opts?.msp ?? 80.0, sd),
    perConditionDrivers: [],
    convergence: {
      trialCheckpoints: opts?.checkpoints ?? [1000, 2000, 3000, 4000, 5000],
      sigmaChi:         opts?.sigmaChi    ?? [8.2, 6.1, 5.4, 4.9, 4.7],
      sigmaPevac:       opts?.sigmaPevac  ?? [3.1, 2.8, 2.4, 2.2, 2.1],
    },
    monteCarloError: {
      trials: 100_000,
      tmeMeanMcse: 0.12,
      chiMeanMcse: 0.03,
      pEvacMcsePct: 0.02,
      pLoclMcsePct: 0.01,
      healthCriterionMcsePct: 0.04,
      pEvacWilson95Pct: [5.43, 5.71],
      pLoclWilson95Pct: [0.39, 0.50],
      healthCriterionWilson95Pct: [79.75, 80.25],
      tmeRelativeMcse: 0.001,
      chiRelativeMcse: 0.0003,
      pEvacRelativeMcse: 0.003,
      pLoclRelativeMcse: 0.02,
      healthCriterionRelativeMcse: 0.0005,
    },
    chiClamp: { count: 3, proportion: 0.00003 },
    treatmentModel: RAF_TREATMENT_MODEL_DISCLOSURE,
  };
}

const analogFieldExposure: AnalogFieldExposureDisclosure = {
  id: "analog-field-exposure-gap-v1",
  label: "Analog field-EVA hazards not modeled",
  status: "not-modeled",
  evidenceStatus: "unsupported",
  appliesWhen: "terrestrial-analog",
  profileEvaType: "terrain-field",
  crewEvaEventCount: 3,
  missionTotalEVAs: 3,
  spaceEvaPriorsReused: false,
  excludedSpaceEvaConditionIds: ["decompression-sickness-eva"],
  omittedAnalogProcessFamilies: [
    "analog-field-exposure",
    "analog-terrain-EVA",
    "polar-outside-operation",
  ],
  limitations: [],
  requiredUpgrade: "Add analog-specific exposure denominators and priors.",
};

describe("IMMHeadlineCard (I1)", () => {
  it("renders without crashing when a full outcome is provided", () => {
    const outcome = makeOutcome();
    expect(() =>
      render(
        <IMMHeadlineCard
          outcome={outcome}
          trials={100_000}
          seed={0xc0ffee}
          mission={{ id: "iss-6mo", label: "ISS 6-month" }}
        />,
      ),
    ).not.toThrow();
  });

  it("displays TME, CHI, pEVAC, pLOCL, and health-criterion numeric values in the DOM", () => {
    const outcome = makeOutcome({
      tme:   123.4,
      chi:   91.5,
      pEvac: 6.7,
      pLocl: 1.2,
      msp:   77.8,
    });
    const { container } = render(
      <IMMHeadlineCard
        outcome={outcome}
        trials={100_000}
        mission={{ id: "iss-6mo", label: "ISS 6-month" }}
      />,
    );
    const text = container.textContent ?? "";
    // Metric labels
    expect(text).toContain("TME");
    expect(text).toContain("CHI");
    expect(text).toContain("pEVAC");
    expect(text).toContain("pLOCL");
    expect(text).toContain("Health criterion");
    // Formatted means (count for TME, "%" for the others)
    expect(text).toContain("123.4");
    expect(text).toContain("91.5%");
    expect(text).toContain("6.7%");
    expect(text).toContain("1.2%");
    expect(text).toContain("77.8%");
  });

  it("caption includes the mission label when provided", () => {
    const outcome = makeOutcome();
    const { container } = render(
      <IMMHeadlineCard
        outcome={outcome}
        trials={50_000}
        seed={0xdeadbeef}
        mission={{ id: "mars-18mo", label: "Mars 18-month" }}
      />,
    );
    expect(container.textContent).toContain("Mars 18-month");
  });

  it("renders Monte Carlo standard error and CHI clamp diagnostics", () => {
    const outcome = makeOutcome();
    const { container } = render(
      <IMMHeadlineCard
        outcome={outcome}
        trials={100_000}
        mission={{ id: "iss-6mo", label: "ISS 6-month" }}
      />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("MCSE");
    expect(text).toContain("rel");
    expect(text).toContain("Wilson 95%");
    expect(text).toContain("CHI clamp");
    expect(text).toContain("3 / 100,000 trials");
  });

  it("renders the RAF treatment-model qualification", () => {
    const outcome = makeOutcome();
    const { container } = render(
      <IMMHeadlineCard
        outcome={outcome}
        trials={100_000}
        mission={{ id: "iss-6mo", label: "ISS 6-month" }}
      />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("Treatment model");
    expect(text).toContain("RAF screening approximation");
    expect(text).toContain("proposal-stage screening-approximation");
    expect(text).toContain("not a treatment-state model");
    expect(text).toContain("Non-substitutable resources");
  });

  it("renders the terrestrial analog field-EVA omission disclosure", () => {
    const outcome = {
      ...makeOutcome(),
      analogFieldExposure,
    };
    const { container } = render(
      <IMMHeadlineCard
        outcome={outcome}
        trials={100_000}
        mission={{ id: "analog-field", label: "Analog field campaign" }}
      />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("Analog field EVA");
    expect(text).toContain("Analog field-EVA hazards not modeled");
    expect(text).toContain("Space-EVA priors are excluded, not reused");
    expect(text).toContain("analog-terrain-EVA");
  });

  it("caption falls back gracefully when mission is omitted", () => {
    const outcome = makeOutcome();
    const { container } = render(
      <IMMHeadlineCard outcome={outcome} trials={10_000} />,
    );
    expect(container.textContent).toContain("(mission not specified)");
  });

  it("renders the convergence sparkline (echarts mock present) when checkpoints exist", () => {
    const outcome = makeOutcome();
    const { container } = render(
      <IMMHeadlineCard
        outcome={outcome}
        trials={5_000}
        mission={{ id: "iss-6mo", label: "ISS 6-month" }}
      />,
    );
    expect(
      container.querySelector("[data-testid='echarts-mock']"),
    ).not.toBeNull();
    // No placeholder text rendered
    expect(container.textContent).not.toContain("T < 1 000");
  });

  it("renders sparkline placeholder (no echarts) when convergence array is empty", () => {
    const outcome = makeOutcome({
      checkpoints: [],
      sigmaChi: [],
      sigmaPevac: [],
    });
    const { container } = render(
      <IMMHeadlineCard
        outcome={outcome}
        trials={500}
        mission={{ id: "iss-6mo", label: "ISS 6-month" }}
      />,
    );
    // Placeholder text present
    expect(container.textContent).toContain("T < 1 000");
    // No echarts mock — sparkline did not render
    expect(
      container.querySelector("[data-testid='echarts-mock']"),
    ).toBeNull();
    // But cards still render
    expect(container.textContent).toContain("TME");
    expect(container.textContent).toContain("Health criterion");
  });

  it("caption mentions trial count with thousands separator", () => {
    const outcome = makeOutcome();
    const { container } = render(
      <IMMHeadlineCard
        outcome={outcome}
        trials={20_000}
        mission={{ id: "iss-6mo", label: "ISS 6-month" }}
      />,
    );
    expect(container.textContent).toMatch(/20[,.]?000/);
  });

  it("oneLine does NOT double-prefix 'Figure I1 |' (FigureCaption renders the prefix)", () => {
    const outcome = makeOutcome();
    const { container } = render(
      <IMMHeadlineCard
        outcome={outcome}
        trials={1_000}
        mission={{ id: "iss-6mo", label: "ISS 6-month" }}
      />,
    );
    const text = container.textContent ?? "";
    // Should appear exactly once — only from FigureCaption's own prefix
    const matches = text.match(/Figure I1/g) ?? [];
    expect(matches.length).toBe(1);
  });
});
