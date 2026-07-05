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
  {
    name: "gamma",
    light: theme("gamma", "light"),
  },
];

describe("handleThemeCommand", () => {
  it("returns the current theme name", () => {
    expect(
      handleThemeCommand("theme", {
        themes,
        currentTheme: theme("alpha", "dark"),
        setTheme: vi.fn(),
      }),
    ).toBe("alpha");
  });

  it("sets a theme by name", () => {
    const setTheme = vi.fn();

    expect(
      handleThemeCommand("theme set beta", {
        themes,
        currentTheme: theme("alpha", "dark"),
        setTheme,
      }),
    ).toBe("Theme set to beta.");
    expect(setTheme).toHaveBeenCalledWith("beta");
  });

  it("sets a random theme with the requested dark mode", () => {
    const setTheme = vi.fn();

    expect(
      handleThemeCommand("theme random dark", {
        themes,
        currentTheme: theme("alpha", "dark"),
        setTheme,
        random: () => 0.75,
      }),
    ).toBe("Theme set to beta.");
    expect(setTheme).toHaveBeenCalledWith("beta");
  });

  it("sets a random theme with the requested light mode", () => {
    const setTheme = vi.fn();

    expect(
      handleThemeCommand("theme random light", {
        themes,
        currentTheme: theme("alpha", "dark"),
        setTheme,
        random: () => 0.75,
      }),
    ).toBe("Theme set to gamma.");
    expect(setTheme).toHaveBeenCalledWith("gamma");
  });

  it("reports unknown theme names", () => {
    expect(
      handleThemeCommand("theme set missing", {
        themes,
        currentTheme: theme("alpha", "dark"),
        setTheme: vi.fn(),
      }),
    ).toBe(
      'Theme "missing" not found. Use "theme random dark" or "theme random light" to discover themes.',
    );
  });

  it("rejects unsupported theme command shapes", () => {
    const ctx = {
      themes,
      currentTheme: theme("alpha", "dark"),
      setTheme: vi.fn(),
    };

    expect(handleThemeCommand("theme beta", ctx)).toBe(
      'Unsupported theme command. Use "theme", "theme set <name>", or "theme random <dark|light>".',
    );
    expect(handleThemeCommand("theme random", ctx)).toBe(
      "Usage: theme random <dark|light>.",
    );
    expect(handleThemeCommand("theme set", ctx)).toBe(
      "Usage: theme set <name>.",
    );
  });
});
