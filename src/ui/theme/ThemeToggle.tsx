// src/ui/theme/ThemeToggle.tsx
import { useTheme } from "./ThemeContext";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
      className="mono uppercase tracking-cap text-ink-2 hover:text-ink-0 transition-colors inline-flex items-center gap-1"
    >
      <span aria-hidden>{isDark ? "☀" : "☾"}</span>
      <span className="hidden sm:inline">{isDark ? "light" : "dark"}</span>
    </button>
  );
}
