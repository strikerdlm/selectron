// src/ui/theme/ThemeContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";
const STORAGE_KEY = "selectron-theme";

function readInitialTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

// Figure-only theme mode. Defaults to "light" so the provider-less `?testFigure=`
// render path (manuscript / snapshot figures via App.tsx's early return) renders
// figures in the original light theme — byte-identical to before. The live app's
// ThemeProvider supplies the active theme below, so in-app figures follow the toggle.
const FigureThemeContext = createContext<Theme>("light");

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
  }, [theme]);
  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <FigureThemeContext.Provider value={theme}>{children}</FigureThemeContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Figure chart theme mode. "light" when no ThemeProvider is mounted (the
 *  `?testFigure=` manuscript/snapshot path), else the live app's active theme. */
export function useFigureThemeMode(): Theme {
  return useContext(FigureThemeContext);
}
