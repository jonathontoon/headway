import type { HistoryItem } from "./terminal";

/**
 * Extract a specific discriminated union variant by type literal.
 * Usage: ExtractByType<HistoryItem, 'status'> instead of Extract<HistoryItem, { type: 'status' }>
 */
export type ExtractByType<
  T extends { type: string },
  K extends T["type"],
> = Extract<T, { type: K }>;

// Convenience aliases for HistoryItem variants
export type StatusHistoryItem = ExtractByType<HistoryItem, "status">;
export type TodoHistoryItem = ExtractByType<HistoryItem, "todo">;
export type TagHistoryItem = ExtractByType<HistoryItem, "tag">;
export type HelpHistoryItem = ExtractByType<HistoryItem, "help">;
export type IntroHistoryItem = ExtractByType<HistoryItem, "intro">;
export type LogoHistoryItem = ExtractByType<HistoryItem, "logo">;
export type DefaultHistoryItem = ExtractByType<HistoryItem, "default">;
export type ClearHistoryItem = ExtractByType<HistoryItem, "clear">;
export type PromptHistoryItem = ExtractByType<HistoryItem, "prompt">;
