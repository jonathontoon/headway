export type ThemeMode = "dark" | "light";

export type Theme = {
  readonly name: string;
  readonly mode: ThemeMode;
  readonly background: string;
  readonly foreground: string;
  readonly colors: string[];
};

export type ThemeFamily = {
  readonly name: string;
  readonly dark?: Theme;
  readonly light?: Theme;
};
