// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ScenarioSelector } from "@/ui/wizard/ScenarioSelector";

afterEach(() => {
  cleanup();
});

describe("ScenarioSelector", () => {
  test("renders three tier buttons with labels and the selected one is highlighted", () => {
    const onChange = vi.fn();
    render(<ScenarioSelector value="minimum" onChange={onChange} />);
    expect(screen.getByRole("radio", { name: /Minimum/i })).toBeDefined();
    expect(screen.getByRole("radio", { name: /Medium/i })).toBeDefined();
    expect(screen.getByRole("radio", { name: /Elite/i })).toBeDefined();
    const minBtn = screen.getByRole("radio", { name: /Minimum/i });
    expect(minBtn.getAttribute("aria-checked")).toBe("true");
  });

  test("clicking a tier fires onChange with the new tier", () => {
    const onChange = vi.fn();
    render(<ScenarioSelector value="minimum" onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: /Elite/i }));
    expect(onChange).toHaveBeenCalledWith("elite");
  });
});
