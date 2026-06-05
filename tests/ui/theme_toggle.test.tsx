// tests/ui/theme_toggle.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@/ui/theme/ThemeContext";
import { ThemeToggle } from "@/ui/theme/ThemeToggle";

beforeEach(() => { localStorage.clear(); document.documentElement.removeAttribute("data-theme"); });
afterEach(cleanup);

describe("ThemeToggle", () => {
  it("defaults to dark and exposes a toggle control", () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(screen.getByRole("button", { name: /theme/i })).toBeTruthy();
  });
  it("switches to light and persists the choice", () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    fireEvent.click(screen.getByRole("button", { name: /theme/i }));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("selectron-theme")).toBe("light");
  });
  it("reads the persisted theme on mount", () => {
    localStorage.setItem("selectron-theme", "light");
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
