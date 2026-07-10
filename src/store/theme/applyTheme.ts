import { THEME } from "./theme";
import { THEME_ROLE_NAMES, type Theme, type ThemeRoleValue } from "./types";

export function resolveRoleColor(theme: Theme, value: ThemeRoleValue): string {
  return typeof value === "number" ? theme.colors[value] : value;
}

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

export function applyInitialTheme(): void {
  applyTheme(THEME);
}
