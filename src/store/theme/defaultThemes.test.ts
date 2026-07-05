import { DEFAULT_THEME_FAMILIES } from "./defaultThemes";
import { handleThemeCommand } from "./themeCommand";

const HYPER_COLORS = [
  "#2d3139",
  "#e06c75",
  "#14fa50",
  "#e0c285",
  "#52adf2",
  "#d55fde",
  "#57b6c2",
  "#ffffff",
  "#5c6370",
  "#ef596f",
  "#89ca78",
  "#e5c07b",
  "#6796e6",
  "#c679dd",
  "#2bbac5",
  "#f8fafd",
];

describe("DEFAULT_THEME_FAMILIES", () => {
  it("includes the dark-only hyper palette", () => {
    const hyper = DEFAULT_THEME_FAMILIES.find(
      (theme) => theme.name === "hyper",
    );

    expect(hyper?.light).toBeUndefined();
    expect(hyper?.dark).toStrictEqual({
      name: "hyper",
      mode: "dark",
      background: "#000000",
      foreground: "#c8c8c8",
      colors: HYPER_COLORS,
    });
    expect(hyper?.dark?.colors).toHaveLength(16);
    expect(hyper?.dark?.colors).toEqual(expect.arrayContaining(HYPER_COLORS));
    expect(
      hyper?.dark?.colors.every((color) => /^#[0-9a-f]{6}$/.test(color)),
    ).toBe(true);
  });

  it("can set hyper through the theme command", () => {
    const setTheme = vi.fn();

    expect(
      handleThemeCommand("theme set hyper", {
        themes: DEFAULT_THEME_FAMILIES,
        currentTheme: DEFAULT_THEME_FAMILIES[0].dark!,
        setTheme,
      }),
    ).toBe("Theme set to hyper.");
    expect(setTheme).toHaveBeenCalledWith("hyper");
  });

  it("explains hyper colors with source usage", () => {
    const hyper = DEFAULT_THEME_FAMILIES.find(
      (theme) => theme.name === "hyper",
    );
    const output = handleThemeCommand("theme test", {
      themes: DEFAULT_THEME_FAMILIES,
      currentTheme: hyper!.dark!,
      setTheme: vi.fn(),
    });

    expect(output).toContain("Theme hyper (dark)");
    expect(output).toContain(
      "foreground #c8c8c8: default app text and terminal output; source: terminal.foreground",
    );
    expect(output).toContain(
      "color0 #2d3139: ANSI black; Headway use: available as text-terminal-0; source: terminal.ansiBlack",
    );
    expect(output).toContain(
      "color1 #e06c75: ANSI red; Headway use: errors, overdue dates, priority A, donation heart; source: inferred from red token color #e06c75",
    );
    expect(output).toContain(
      "color11 #e5c07b: ANSI bright yellow; Headway use: warnings, due today, priority B; source: inferred from terminal.ansiYellow / yellow token color #e5c07b",
    );
  });
});
