import { DEFAULT_THEME_FAMILIES } from "./defaultThemes";
import { handleThemeCommand } from "./themeCommand";
import { resolveRoleColor } from "./applyTheme";
import { contrastRatio } from "./contrast";
import { THEME_ROLE_NAMES } from "./types";

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
      roles: {
        error: 1,
        warning: 3,
        success: 2,
        info: 5,
        accent: 6,
        context: 4,
        command: 3,
        muted: "#767676",
      },
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
      "color1 #e06c75: ANSI red; Headway use: default source for role error; source: inferred from red token color #e06c75",
    );
    expect(output).toContain(
      "color11 #e5c07b: ANSI bright yellow; Headway use: fallback source for roles warning and command; source: inferred from terminal.ansiYellow / yellow token color #e5c07b",
    );
    expect(output).toContain(
      "role error #e06c75: from color1; contrast 6.6; Headway use: errors, overdue dates, priority A, donation heart",
    );
    expect(output).toContain(
      "role muted #767676: blended for contrast; contrast 4.6; Headway use: task ids, section headers, help descriptions, priorities D-Z",
    );
  });

  it("resolves every role of every theme variant to WCAG AA contrast", () => {
    for (const family of DEFAULT_THEME_FAMILIES) {
      for (const theme of [family.dark, family.light]) {
        if (!theme) continue;
        for (const role of THEME_ROLE_NAMES) {
          const color = resolveRoleColor(theme, theme.roles[role]);
          const ratio = contrastRatio(color, theme.background);
          expect
            .soft(ratio, `${theme.name} (${theme.mode}) role ${role} ${color}`)
            .toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
});
