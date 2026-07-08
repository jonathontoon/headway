import { DEFAULT_THEME_FAMILIES } from "./defaultThemes";
import type { Theme, ThemeFamily, ThemeMode } from "./types";

export const THEME_STORAGE_KEY = "headway-theme";
export const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

export function applyTheme(theme: Theme) {
  const style = document.documentElement.style;
  style.setProperty("--background", theme.background);
  style.setProperty("--foreground", theme.foreground);
  theme.colors.forEach((color, i) => style.setProperty(`--color${i}`, color));

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme.background);
}

export function getPreferredMode(): ThemeMode {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia(COLOR_SCHEME_QUERY).matches ? "dark" : "light";
}

export function readStoredThemeName(): string {
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

export function writeStoredThemeName(name: string): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, name);
  } catch {
    // ignore in environments without localStorage
  }
}

export function selectTheme(
  themes: readonly ThemeFamily[],
  name: string,
  mode: ThemeMode,
): Theme {
  const family = themes.find((t) => t.name === name) ?? themes[0];
  return family[mode] ?? family.dark ?? family.light ?? themes[0].dark!;
}

export function applyInitialTheme(): void {
  const name = readStoredThemeName();
  const mode = getPreferredMode();
  applyTheme(selectTheme(DEFAULT_THEME_FAMILIES, name, mode));
}
