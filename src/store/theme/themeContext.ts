import { createContext, useContext } from "react";
import type { Theme, ThemeFamily } from "./types";

export type ThemeStore = {
  readonly theme: Theme;
  readonly themes: readonly ThemeFamily[];
  readonly setTheme: (name: string) => void;
};

export const ThemeContext = createContext<ThemeStore | null>(null);

export function useTheme(): ThemeStore {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
