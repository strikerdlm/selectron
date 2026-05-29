// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { HealthSupportTierPicker } from "../../src/ui/health/HealthSupportTierPicker";
import { HealthSupportBreakdown } from "../../src/ui/health/HealthSupportBreakdown";
import { HealthSupportSeverityReadout } from "../../src/ui/health/HealthSupportSeverityReadout";
import { IMM_KITS } from "../../src/imm/kits";

afterEach(cleanup);

describe("HealthSupportTierPicker", () => {
  it("renders all four tiers and fires onSelect with the kit", () => {
    const onSelect = vi.fn();
    render(<HealthSupportTierPicker selectedId="issHMS" onSelect={onSelect} />);
    expect(screen.getByText(/None/)).toBeTruthy();
    expect(screen.getByText(/Medium/)).toBeTruthy();
    expect(screen.getByText(/ISS/)).toBeTruthy();
    expect(screen.getByText(/Unlimited/)).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: /Medium/i }));
    expect(onSelect).toHaveBeenCalledWith(IMM_KITS.medium);
  });
});

describe("HealthSupportBreakdown", () => {
  it("shows capability categories and dims undeliverable items for None", () => {
    render(<HealthSupportBreakdown tierId="none" />);
    expect(screen.getByText(/Telemedicine/i)).toBeTruthy();
    expect(screen.getByText(/Onboard provider/i)).toBeTruthy();
    const defib = screen.getByText(/Defibrillator/i).closest("[data-deliverable]");
    expect(defib?.getAttribute("data-deliverable")).toBe("false");
  });

  it("marks the same item deliverable for ISS", () => {
    render(<HealthSupportBreakdown tierId="issHMS" />);
    const defib = screen.getByText(/Defibrillator/i).closest("[data-deliverable]");
    expect(defib?.getAttribute("data-deliverable")).toBe("true");
  });

  it("collapses a category section when its header is clicked", () => {
    render(<HealthSupportBreakdown tierId="issHMS" />);
    expect(screen.getByText(/Defibrillator/i)).toBeTruthy(); // procedures open by default
    fireEvent.click(screen.getByRole("button", { name: /Procedures.*equipment/i }));
    expect(screen.queryByText(/Defibrillator/i)).toBeNull(); // collapsed → not in DOM
  });
});

describe("HealthSupportSeverityReadout", () => {
  it("renders CHI and a delta vs the ISS baseline", () => {
    render(
      <HealthSupportSeverityReadout
        tierLabel="Medium (Analog / Antarctic)"
        chiMean={75.4} issBaselineChi={82.8}
        verdictColor="yellow" verdictScore={18}
      />,
    );
    expect(screen.getByText(/75\.4/)).toBeTruthy();
    expect(screen.getByText(/7\.4 vs ISS/)).toBeTruthy();
    expect(screen.getByText(/yellow/i)).toBeTruthy();
  });
});
