import type { StatusType } from "@components/Status";

// ============================================================================
// Todo Models
// ============================================================================

export interface TodoItem {
  id: string;
  raw: string;
  completed: boolean;
  archived?: boolean;
  priority?: string;
  completionDate?: string;
  creationDate?: string;
  text: string;
  contexts: string[];
  projects: string[];
}

// ============================================================================
// Terminal Responses
// ============================================================================

export type TerminalResponse =
  | {
      type: "status";
      statusType: StatusType;
      statusText: string;
      hintText?: string;
    }
  | { type: "todo"; todos: TodoItem[]; title?: string }
  | { type: "tag"; tags: string[]; variant: "context" | "project" }
  | { type: "help" }
  | { type: "intro" }
  | { type: "logo" }
  | { type: "default"; commandName: string; hintText?: string }
  | { type: "clear" }
  | { type: "prompt"; value: string };

// ============================================================================
// Terminal State
// ============================================================================

export type HistoryItem = TerminalResponse & { id: string };

export type TerminalState = {
  history: HistoryItem[];
  input: string;
  isProcessing: boolean;
  historyIndex: number;
  commandHistory: string[];
};

export type TerminalAction =
  | { type: "PUSH_RESPONSE"; payload: TerminalResponse[] }
  | { type: "SET_INPUT"; payload: string }
  | { type: "SET_PROCESSING"; payload: boolean }
  | { type: "RESET" }
  | { type: "ADD_COMMAND"; payload: string }
  | { type: "SET_HISTORY_INDEX"; payload: number };

// ============================================================================
// Type Helpers
// ============================================================================

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
