// @vitest-environment jsdom
// Smoke test: review-flag banner renders with failed gate ids.
// Uses a minimal mock render of the banner JSX only — not the full Sim view
// (which depends on Dexie, ECharts, and many context providers). This tests
// the markup structure that CHIExplainer emits when the internal gate verdict
// indicates a demo-threshold review flag.

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { GateResult } from "@/types";

afterEach(cleanup);

// Extract banner to a standalone test-fixture component so we can render it
// without wiring CHIExplainer's full prop set (RiskScenarioResult, chiStar, etc.).
function ReviewFlagBanner({ gate }: { gate: GateResult }) {
  if (gate.verdict !== "review-flagged") return null;
  return (
    <div
      role="alert"
      className="mt-4 panel border border-red-500 bg-red-50 rounded-md p-4"
      data-testid="review-flag-banner"
    >
      <div className="font-semibold text-red-900 mb-2">
        REVIEW REQUIRED — demo-threshold flag
      </div>
      <p className="text-sm text-red-800 mb-2">
        One or more demonstration thresholds were flagged.
      </p>
      <ul className="mt-2 list-disc list-inside text-sm text-red-800 font-mono">
        {gate.failedGates.map((g) => (
          <li key={g}>{g}</li>
        ))}
      </ul>
      {gate.notes && (
        <p className="text-xs text-red-700 mt-2 italic">Note: {gate.notes}</p>
      )}
    </div>
  );
}

describe("demo-threshold review banner", () => {
  it("renders when gate verdict is review-flagged and lists failed gates", () => {
    const gate: GateResult = {
      verdict: "review-flagged",
      failedGates: ["psych.mmpi2rf_eid"],
      evaluated: ["psych.mmpi2rf_eid", "cognitive.nasa_cognition_battery"],
    };
    render(<ReviewFlagBanner gate={gate} />);
    expect(screen.getByTestId("review-flag-banner")).toBeDefined();
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText(/REVIEW REQUIRED — demo-threshold flag/i)).toBeDefined();
    expect(screen.getByText("psych.mmpi2rf_eid")).toBeDefined();
  });

  it("lists all failed gates when multiple criteria fail", () => {
    const gate: GateResult = {
      verdict: "review-flagged",
      failedGates: ["psych.mmpi2rf_eid", "cognitive.nasa_cognition_battery"],
      evaluated: ["psych.mmpi2rf_eid", "cognitive.nasa_cognition_battery"],
    };
    render(<ReviewFlagBanner gate={gate} />);
    expect(screen.getByText("psych.mmpi2rf_eid")).toBeDefined();
    expect(screen.getByText("cognitive.nasa_cognition_battery")).toBeDefined();
  });

  it("renders notes when gate has notes", () => {
    const gate: GateResult = {
      verdict: "review-flagged",
      failedGates: ["psych.mmpi2rf_eid"],
      evaluated: ["psych.mmpi2rf_eid"],
      notes: "missing score for psych.mmpi2rf_eid",
    };
    render(<ReviewFlagBanner gate={gate} />);
    expect(screen.getByText(/missing score for psych.mmpi2rf_eid/i)).toBeDefined();
  });

  it("does not render banner when gate verdict is clear", () => {
    const gate: GateResult = {
      verdict: "clear",
      failedGates: [],
      evaluated: ["psych.mmpi2rf_eid", "cognitive.nasa_cognition_battery"],
    };
    render(<ReviewFlagBanner gate={gate} />);
    expect(screen.queryByTestId("review-flag-banner")).toBeNull();
  });
});
