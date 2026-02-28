import type {
  TaskAction,
  TaskBucket,
  TaskPriority,
  VisibleTask,
} from "@reducers/tasks/taskTypes";

export type TerminalMessageLevel = "info" | "success" | "warning" | "error";
export type TranscriptStatus = "pending" | "resolved" | "rejected";

export interface HelpCommand {
  name: string;
  description: string;
}

export interface HelpSection {
  title: string;
  commands: readonly HelpCommand[];
}

export type TerminalEvent =
  | { kind: "message"; level: TerminalMessageLevel; text: string }
  | { kind: "taskList"; mode: "flat" | "grouped"; items: readonly VisibleTask[] }
  | { kind: "help"; sections: readonly HelpSection[] };

export interface TranscriptEntry {
  id: string;
  command: string | null;
  status: TranscriptStatus;
  events: readonly TerminalEvent[];
}

export interface TerminalState {
  input: string;
  transcript: readonly TranscriptEntry[];
  commandHistory: readonly string[];
  historyIndex: number;
  pendingCommandId: string | null;
}

export type ParsedCommand =
  | { type: "help" }
  | { type: "clear" }
  | { type: "list" }
  | { type: "add"; title: string }
  | { type: "done"; target: string }
  | { type: "delete"; target: string }
  | { type: "edit"; target: string; title: string }
  | { type: "move"; target: string; bucket: TaskBucket }
  | { type: "priority"; target: string; priority: TaskPriority | null }
  | { type: "due"; target: string; dueDate: string | null };

export type ParseResult =
  | { ok: true; command: ParsedCommand }
  | { ok: false; error: string };

export interface AutocompleteResult {
  completed: string;
  insertPosition: number;
}

export interface CommandExecutionResult {
  clearTerminal: boolean;
  entryStatus: TranscriptStatus;
  events: readonly TerminalEvent[];
  taskAction: TaskAction | null;
}

export type TerminalAction =
  | { type: "terminal/setInput"; value: string }
  | { type: "terminal/appendEntry"; entry: TranscriptEntry }
  | {
      type: "terminal/resolveEntry";
      entryId: string;
      status: TranscriptStatus;
      events: readonly TerminalEvent[];
    }
  | { type: "terminal/recordCommand"; command: string }
  | { type: "terminal/navigateHistory"; direction: "up" | "down" }
  | { type: "terminal/clear" };
