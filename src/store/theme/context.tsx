import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  applyTheme,
  COLOR_SCHEME_QUERY,
  getPreferredMode,
  readStoredThemeName,
  selectTheme,
  writeStoredThemeName,
} from "./applyTheme";
import { DEFAULT_THEME_FAMILIES } from "./defaultThemes";
import { ThemeContext, type ThemeStore } from "./themeContext";
import type { Theme, ThemeMode } from "./types";

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

  useLayoutEffect(() => {
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
