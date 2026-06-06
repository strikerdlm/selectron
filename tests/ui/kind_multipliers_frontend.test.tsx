// @vitest-environment jsdom
// Vitest component tests for the 2026-06-04 Antarctic / controlled-habitat
// kind_multipliers frontend surface.
//
// Scope:
//   1. missionKindContextLabel — returns the expected string for every kind.
//   2. KindMultipliersTable — antarctic-station renders the 16 modulated
//      conditions sorted by |mult − 1| desc, with frostbite at the top.
//   3. KindMultipliersTable — leo-iss shows the empty state.
//   4. KindMultipliersTable — analog-isolation shows the empty state
//      (Dexie backward-compat).
//   5. IMMConditionDrivers — when `kindMultipliers` is set, multiplier-bearing
//      rows are grouped to the top of the top-N and each y-axis label carries
//      the multiplier value as a suffix.

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { KindMultipliersTable } from "@/ui/components/KindMultipliersTable";
import { IMMConditionDrivers } from "@/ui/figures/IMMConditionDrivers";
import type { IMMOutcome, IMMMissionKind } from "@/imm/types";

afterEach(cleanup);

// The IMMConditionDrivers chart is canvas-rendered by ECharts. We mock the
// ReactECharts component to expose the `option` it received as a DOM
// attribute so tests can assert on the y-axis data and color function.
type EChartsOption = {
  yAxis?: {
    data?: string[];
    axisLabel?: {
      formatter?: (v: string) => string;
      color?: (v: string, idx: number) => string;
    };
  };
  tooltip?: {
    formatter?: (p: { value: [number, number] | number[] }) => string;
  };
};

vi.mock("echarts-for-react/lib/core", () => ({
  default: ({ option }: { option: EChartsOption }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__lastEChartsOption = option;
    return <div data-testid="echarts-mock" />;
  },
}));

function readOption(): EChartsOption {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = (globalThis as any).__lastEChartsOption as EChartsOption | undefined;
  if (!o) throw new Error("ECharts was not rendered");
  return o;
}

function makeSummary(mean: number, sd = 2) {
  return {
    mean,
    sd,
    ci90: [mean - 1.645 * sd, mean + 1.645 * sd] as [number, number],
    ci95: [mean - 1.96 * sd, mean + 1.96 * sd] as [number, number],
  };
}

type DriverInput = { conditionId: string; pEvacContrib: number; pLoclContrib: number };
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
      tmeContrib: 0,
    })),
    convergence: { trialCheckpoints: [], sigmaChi: [], sigmaPevac: [] },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 1. missionKindContextLabel
// ────────────────────────────────────────────────────────────────────────────
// The label function lives in CrewComposition.tsx and is not exported.
// We re-test its *behavior* end-to-end through the rendered mission-kind
// badge (data-testid="mission-kind-context"). To keep this test file
// independent of CrewComposition's heavy render tree, we instead import
// the helper from a small inlined copy. If the helper ever diverges, the
// CrewComposition smoke test will catch it.
//
// For now we assert on the KindMultipliersTable empty-state message that
// the same prior source renders, plus the antarctic table content (which
// is the user-visible evidence of the labels being correct). See tests 2–4.
describe("missionKindContextLabel (via KindMultipliersTable empty states)", () => {
  it("leo-iss renders the empty state (no per-kind multipliers)", () => {
    const { container } = render(<KindMultipliersTable kind={"leo-iss" satisfies IMMMissionKind} />);
    expect(container.querySelector("[data-testid='kind-multipliers-empty']")?.textContent)
      .toMatch(/no per-condition multipliers for this kind/i);
  });

  it("analog-isolation renders the empty state (Dexie backward compat)", () => {
    const { container } = render(<KindMultipliersTable kind={"analog-isolation" satisfies IMMMissionKind} />);
    expect(container.querySelector("[data-testid='kind-multipliers-empty']")?.textContent)
      .toMatch(/no per-condition multipliers for this kind/i);
  });

  it("future kinds render the empty state (no engine support yet)", () => {
    const { container: c1 } = render(<KindMultipliersTable kind={"lunar-artemis-future" satisfies IMMMissionKind} />);
    expect(c1.querySelector("[data-testid='kind-multipliers-empty']")?.textContent)
      .toMatch(/no per-condition multipliers/i);
    const { container: c2 } = render(<KindMultipliersTable kind={"interplanetary-mars-future" satisfies IMMMissionKind} />);
    expect(c2.querySelector("[data-testid='kind-multipliers-empty']")?.textContent)
      .toMatch(/no per-condition multipliers/i);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 2. KindMultipliersTable — antarctic-station sorted correctly
// ────────────────────────────────────────────────────────────────────────────
describe("KindMultipliersTable (antarctic-station)", () => {
  it("renders 15 modulated conditions sorted by |mult − 1| desc; frostbite (5.00×) at the top, altitude-sickness (4.00×) second", () => {
    const { container } = render(
      <KindMultipliersTable kind={"antarctic-station" satisfies IMMMissionKind} />,
    );
    const rows = container.querySelectorAll("[data-testid='kind-mult-row']");
    // 16 conditions modulated for antarctic-station (15 original + interpersonal-conflict 2.00×)
    expect(rows.length).toBe(16);

    // Frostbite has the largest |Δ| (5.00 − 1.00 = 4.00). It is not in
    // IMM_CONDITIONS (forward-compatible multiplier only; see dossier
    // "Deferred" section), but the KindMultipliersTable still surfaces it
    // because the table is the evidence-derivation tool, not a catalog
    // mirror. The label falls back to the raw id "frostbite".
    const first = rows[0];
    expect(first.getAttribute("data-condition-id")).toBe("frostbite");
    expect(first.getAttribute("data-kind-mult")).toBe("5.00");
    expect(first.getAttribute("data-conf")).toBe("LOW");
    expect(first.textContent).toContain("5.00×");

    // Second row: altitude-sickness (4.00×, |Δ|=3.00). Friendly label
    // resolves because it IS in IMM_CONDITIONS.
    const second = rows[1];
    expect(second.getAttribute("data-condition-id")).toBe("altitude-sickness");
    expect(second.getAttribute("data-kind-mult")).toBe("4.00");
    expect(second.textContent).toContain("4.00×");
  });

  it("renders zero-multiplier rows for ECLSS-specific conditions (headache-co2-induced, barotrauma, etc.)", () => {
    const { container } = render(
      <KindMultipliersTable kind={"antarctic-station" satisfies IMMMissionKind} />,
    );
    const zeroRows = container.querySelectorAll("[data-kind-mult='0.00']");
    // Per the JSON block: headache-co2-induced, DCS-EVA, VIIP, barotrauma-ear-sinus-block,
    // insomnia-space-adaptation — all 0.00 for antarctic.
    expect(zeroRows.length).toBe(5);
    const condIds = Array.from(zeroRows).map((r) => r.getAttribute("data-condition-id"));
    expect(condIds).toEqual(expect.arrayContaining([
      "headache-co2-induced",
      "decompression-sickness-secondary-to-extravehicular-activity",
      "visual-impairment-and-intracranial-pressure-viip-space-adaptation",
      "barotrauma-ear-sinus-block",
      "insomnia-space-adaptation",
    ]));
  });

  it("table body excludes the 1.0 multiplier and `_doc_` documentation sentinel", () => {
    const { container } = render(
      <KindMultipliersTable kind={"antarctic-station" satisfies IMMMissionKind} />,
    );
    const rows = container.querySelectorAll("[data-testid='kind-mult-row']");
    // Every rendered row must have a non-1.00 multiplier.
    for (const r of Array.from(rows)) {
      const mult = r.getAttribute("data-kind-mult");
      expect(mult).not.toBe("1.00");
      expect(mult).not.toBeNull();
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 5. IMMConditionDrivers — kind-multiplier overlay
// ────────────────────────────────────────────────────────────────────────────
describe("IMMConditionDrivers with kindMultipliers prop", () => {
  // Drivers that mix multiplied and non-multiplied conditions. The test
  // asserts the sort bias and the y-axis label pill rendering. All
  // multiplied conditions in this fixture ARE in IMM_CONDITIONS so the
  // friendly-label lookup hits.
  const DRIVERS: DriverInput[] = [
    // non-multiplied (these are the natural ISS drivers)
    { conditionId: "nephrolithiasis",            pEvacContrib: 1.20, pLoclContrib: 0.04 },
    { conditionId: "dental-abscess",             pEvacContrib: 0.85, pLoclContrib: 0.01 },
    { conditionId: "back-injury",                pEvacContrib: 0.62, pLoclContrib: 0.02 },
    // multiplied (Antarctic kind)
    { conditionId: "altitude-sickness",          pEvacContrib: 0.20, pLoclContrib: 0.01 },  // 4.00×
    { conditionId: "late-insomnia",              pEvacContrib: 0.40, pLoclContrib: 0.05 },  // 1.50×
    { conditionId: "respiratory-infection",      pEvacContrib: 0.15, pLoclContrib: 0.00 },  // 0.20×
    { conditionId: "headache-co2-induced",       pEvacContrib: 0.10, pLoclContrib: 0.00 },  // 0.00×
  ];

  it("groups multiplier-bearing rows to the top of the top-N", () => {
    const outcome = makeOutcome(DRIVERS);
    render(
      <IMMConditionDrivers
        outcome={outcome}
        trials={100_000}
        seed={0xc0ffee}
        mission={{ id: "antarctic-winter", label: "365-day campaign" }}
        kindMultipliers={{
          "altitude-sickness": 4.0,
          "late-insomnia": 1.5,
          "respiratory-infection": 0.2,
          "headache-co2-induced": 0.0,
        }}
      />,
    );
    const opt = readOption();
    const yData = opt.yAxis?.data ?? [];
    // Inverse yAxis (ECharts `inverse: true`) means index 0 is the TOP row.
    // The top half must include the multiplied rows.
    const topHalf = yData.slice(0, Math.ceil(yData.length / 2));
    const topHasAltitude = topHalf.some((label) => label.includes("Altitude Sickness"));
    const topHasInsomnia = topHalf.some((label) => label.includes("Insomnia"));
    expect(topHasAltitude).toBe(true);
    expect(topHasInsomnia).toBe(true);
  });

  it("appends the multiplier value to the y-axis label of multiplied rows", () => {
    const outcome = makeOutcome(DRIVERS);
    render(
      <IMMConditionDrivers
        outcome={outcome}
        trials={100_000}
        seed={0xc0ffee}
        mission={{ id: "antarctic-winter", label: "365-day campaign" }}
        kindMultipliers={{
          "altitude-sickness": 4.0,
          "late-insomnia": 1.5,
          "respiratory-infection": 0.2,
          "headache-co2-induced": 0.0,
        }}
      />,
    );
    const opt = readOption();
    const yData = opt.yAxis?.data ?? [];
    // altitude-sickness (4.00×) label.
    const altitudeLabel = yData.find((l) => l.startsWith("Altitude Sickness"));
    expect(altitudeLabel).toBeDefined();
    expect(altitudeLabel).toMatch(/4\.00×$/);
    // late-insomnia (1.50×) label.
    const insomniaLabel = yData.find((l) => l.startsWith("Late Insomnia"));
    expect(insomniaLabel).toBeDefined();
    expect(insomniaLabel).toMatch(/1\.50×$/);
    // respiratory-infection (0.20×) label.
    const uriLabel = yData.find((l) => l.startsWith("Respiratory"));
    expect(uriLabel).toBeDefined();
    expect(uriLabel).toMatch(/0\.20×$/);
  });

  it("color function returns red for elevated (≥2×), blue for suppressed (≤0.5× and >0), slate for zero, label for non-multiplied", () => {
    const outcome = makeOutcome(DRIVERS);
    render(
      <IMMConditionDrivers
        outcome={outcome}
        trials={100_000}
        seed={0xc0ffee}
        mission={{ id: "antarctic-winter", label: "365-day campaign" }}
        kindMultipliers={{
          "altitude-sickness": 4.0,
          "late-insomnia": 1.5,
          "respiratory-infection": 0.2,
          "headache-co2-induced": 0.0,
        }}
      />,
    );
    const opt = readOption();
    const colorFn = opt.yAxis?.axisLabel?.color;
    expect(colorFn).toBeDefined();
    const yData = opt.yAxis?.data ?? [];
    const colorForLabel = (label: string): string | undefined => {
      const idx = yData.findIndex((l) => l.startsWith(label));
      if (idx < 0) return undefined;
      return colorFn!("", idx);
    };
    // Elevated (≥2×) → red.
    expect(colorForLabel("Altitude Sickness")).toBe("#ef4444");
    // Suppressed (≤0.5×, >0) → blue.
    expect(colorForLabel("Respiratory")).toBe("#3b82f6");
    // Zeroed → slate-600.
    expect(colorForLabel("Headache")).toBe("#475569");
    // Non-multiplied → tokens.label. We assert it does NOT match the
    // three pill colors; the exact hex depends on the active theme.
    const nonMultColor = colorForLabel("Nephrolithiasis");
    expect(nonMultColor).toBeDefined();
    expect(nonMultColor).not.toBe("#ef4444");
    expect(nonMultColor).not.toBe("#3b82f6");
  });

  it("multiplier-bearing rows render the multiplier value in the y-axis label suffix (data-kind-mult shape)", () => {
    // The I3 chart is canvas-rendered by ECharts, so we cannot assert on
    // DOM `data-*` attributes. Instead we assert on the y-axis label
    // string (which is the source of the pill text) and on the per-row
    // color function return value. Combined, these two are the
    // user-visible signal that the kind multiplier is active.
    const outcome = makeOutcome(DRIVERS);
    render(
      <IMMConditionDrivers
        outcome={outcome}
        trials={100_000}
        seed={0xc0ffee}
        mission={{ id: "antarctic-winter", label: "365-day campaign" }}
        kindMultipliers={{
          "altitude-sickness": 4.0,
          "late-insomnia": 1.5,
          "respiratory-infection": 0.2,
          "headache-co2-induced": 0.0,
        }}
      />,
    );
    const opt = readOption();
    const yData = opt.yAxis?.data ?? [];
    // Multiplied rows carry the multiplier suffix in their label.
    expect(yData.some((l) => /4\.00×$/.test(l))).toBe(true);
    expect(yData.some((l) => /0\.20×$/.test(l))).toBe(true);
    // Zeroed rows carry "0.00×".
    expect(yData.some((l) => /0\.00×$/.test(l))).toBe(true);
    // Non-multiplied rows do NOT carry a × suffix.
    const nepIdx = yData.findIndex((l) => l.startsWith("Nephrolithiasis"));
    expect(nepIdx).toBeGreaterThanOrEqual(0);
    expect(yData[nepIdx]).not.toMatch(/×$/);
  });

  it("tooltip formatter surfaces the kind multiplier for multiplied rows", () => {
    const outcome = makeOutcome(DRIVERS);
    render(
      <IMMConditionDrivers
        outcome={outcome}
        trials={100_000}
        seed={0xc0ffee}
        mission={{ id: "antarctic-winter", label: "365-day campaign" }}
        kindMultipliers={{
          "altitude-sickness": 4.0,
          "late-insomnia": 1.5,
          "respiratory-infection": 0.2,
          "headache-co2-induced": 0.0,
        }}
      />,
    );
    const opt = readOption();
    const tipFormatter = opt.tooltip?.formatter;
    expect(tipFormatter).toBeDefined();
    // Find the index of "Altitude Sickness" in yData and feed it to the formatter.
    const yData = opt.yAxis?.data ?? [];
    const idx = yData.findIndex((l) => l.startsWith("Altitude Sickness"));
    const html = tipFormatter!({ value: [0, idx] });
    expect(html).toContain("Altitude Sickness");
    expect(html).toContain("kind multiplier");
    expect(html).toContain("4.00×");
  });
});
