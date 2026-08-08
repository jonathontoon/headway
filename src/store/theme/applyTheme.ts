import { THEME } from "./theme";
import { THEME_ROLE_NAMES, type Theme, type ThemeRoleValue } from "./types";

/**
 * Resolves a semantic role value to an actual color string.
 *
 * @param theme - Theme that supplies indexed colors and fallback foreground.
 * @param value - Role value to resolve.
 * @returns Hex color string.
 */
export function resolveRoleColor(theme: Theme, value: ThemeRoleValue): string {
  return typeof value === "number"
    ? (theme.colors[value] ?? theme.foreground)
    : value;
}

/**
 * Applies terminal theme colors to document CSS variables.
 *
 * @param theme - Theme to apply to the page.
 * @returns Nothing.
 */
export function applyTheme(theme: Theme): void {
  const style = document.documentElement.style;
  style.setProperty("--background", theme.background);
  style.setProperty("--foreground", theme.foreground);
  theme.colors.forEach((color, i) => style.setProperty(`--color${i}`, color));
  THEME_ROLE_NAMES.forEach((role) =>
    style.setProperty(
      `--role-${role}`,
      resolveRoleColor(theme, theme.roles[role]),
    ),
  );

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme.background);
}

/**
 * Applies the built-in terminal theme.
 *
 * @returns Nothing.
 */
export function applyInitialTheme(): void {
  applyTheme(THEME);
}
