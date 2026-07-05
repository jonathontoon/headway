import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { DEFAULT_THEME_FAMILIES } from "./defaultThemes";
import { ThemeContext, type ThemeStore } from "./themeContext";
import type { Theme, ThemeFamily, ThemeMode } from "./types";

const THEME_STORAGE_KEY = "headway-theme";
const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

function applyTheme(theme: Theme) {
  const style = document.documentElement.style;
  style.setProperty("--background", theme.background);
  style.setProperty("--foreground", theme.foreground);
  theme.colors.forEach((color, i) => style.setProperty(`--color${i}`, color));
}

function getPreferredMode(): ThemeMode {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia(COLOR_SCHEME_QUERY).matches ? "dark" : "light";
}

function readStoredThemeName(): string {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed === "string") return parsed;
      if (typeof parsed?.name === "string") return parsed.name;
    }
  } catch {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) return stored;
    } catch {
      // ignore
    }
  }
  return DEFAULT_THEME_FAMILIES[0].name;
}

function writeStoredThemeName(name: string): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, name);
  } catch {
    // ignore in environments without localStorage
  }
}

function selectTheme(
  themes: readonly ThemeFamily[],
  name: string,
  mode: ThemeMode,
): Theme {
  const family = themes.find((t) => t.name === name) ?? themes[0];
  return family[mode] ?? family.dark ?? family.light ?? themes[0].dark!;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [themeName, setThemeName] = useState<string>(readStoredThemeName);
  const [mode, setMode] = useState<ThemeMode>(getPreferredMode);

  const theme = useMemo<Theme>(() => {
    return selectTheme(DEFAULT_THEME_FAMILIES, themeName, mode);
  }, [themeName, mode]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const media = window.matchMedia(COLOR_SCHEME_QUERY);
    const syncMode = () => setMode(media.matches ? "dark" : "light");

    syncMode();
    media.addEventListener("change", syncMode);
    return () => media.removeEventListener("change", syncMode);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    writeStoredThemeName(themeName);
  }, [themeName]);

  const store = useMemo<ThemeStore>(
    () => ({
      theme,
      themes: DEFAULT_THEME_FAMILIES,
      setTheme(name: string) {
        setThemeName(name);
      },
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={store}>{children}</ThemeContext.Provider>
  );
}
