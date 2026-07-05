import { handleThemeCommand } from "./themeCommand";
import type { Theme, ThemeFamily } from "./types";

function theme(name: string, mode: "dark" | "light"): Theme {
  return {
    name,
    mode,
    background: mode === "dark" ? "#000000" : "#ffffff",
    foreground: mode === "dark" ? "#ffffff" : "#000000",
    colors: Array.from({ length: 16 }, () => "#000000"),
  };
}

const themes: readonly ThemeFamily[] = [
  {
    name: "alpha",
    dark: theme("alpha", "dark"),
    light: theme("alpha", "light"),
  },
  {
    name: "beta",
    dark: theme("beta", "dark"),
  },
];

describe("handleThemeCommand", () => {
  it("lists selectable theme names only and marks the current theme", () => {
    expect(
      handleThemeCommand("theme", {
        themes,
        currentTheme: theme("alpha", "dark"),
        setTheme: vi.fn(),
        importTheme: vi.fn(),
      }),
    ).toBe("* alpha\n  beta ");
  });

  it("switches by theme name without requiring a variant", () => {
    const setTheme = vi.fn();

    expect(
      handleThemeCommand("theme beta", {
        themes,
        currentTheme: theme("alpha", "dark"),
        setTheme,
        importTheme: vi.fn(),
      }),
    ).toBe("Theme set to beta.");
    expect(setTheme).toHaveBeenCalledWith("beta");
  });

  it("rejects manual variants", () => {
    expect(
      handleThemeCommand("theme alpha dark", {
        themes,
        currentTheme: theme("alpha", "dark"),
        setTheme: vi.fn(),
        importTheme: vi.fn(),
      }),
    ).toBe(
      "Manual theme variants are not supported. Light/dark follows your browser.",
    );
  });

  it("reports unknown theme names", () => {
    expect(
      handleThemeCommand("theme missing", {
        themes,
        currentTheme: theme("alpha", "dark"),
        setTheme: vi.fn(),
        importTheme: vi.fn(),
      }),
    ).toBe('Theme "missing" not found. Run "theme" to list available themes.');
  });
});
