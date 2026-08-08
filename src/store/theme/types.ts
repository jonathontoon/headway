/** Theme role names mapped to terminal semantic colors. */
export const THEME_ROLE_NAMES = [
  "error",
  "warning",
  "success",
  "info",
  "accent",
  "context",
  "command",
  "muted",
] as const;

/** Supported semantic color role name. */
export type ThemeRoleName = (typeof THEME_ROLE_NAMES)[number];

/** Theme role value, either a color index or a resolved hex color. */
export type ThemeRoleValue = number | string;

/** Mapping from each semantic role to a theme color value. */
export type ThemeRoles = Readonly<Record<ThemeRoleName, ThemeRoleValue>>;

/** Complete terminal color theme definition. */
export type Theme = {
  readonly name: string;
  readonly background: string;
  readonly foreground: string;
  readonly colors: string[];
  readonly roles: ThemeRoles;
};
