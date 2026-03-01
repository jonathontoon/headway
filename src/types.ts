import type { ChangeEvent, KeyboardEvent, ReactNode, Ref } from "react";
import { TERMINAL_ACTION_TYPES } from "./constants";

export type TerminalStatusLevel = "error" | "warning" | "success";
export type HistoryDirection = "up" | "down";
export type PendingCommandKind = "deploy";

export type TerminalCommandSyntaxArgument =
  | { kind: "choice"; options: readonly string[] }
  | { kind: "value"; name: string };

export interface TerminalCommandSyntax {
  command: string;
  arguments?: readonly TerminalCommandSyntaxArgument[];
}

export interface TerminalHelpRow {
  syntax: TerminalCommandSyntax;
  description: string;
}

export interface TerminalGridRow {
  label: string;
  value: string;
}

export interface GridDisplayRow {
  label: ReactNode;
  value: ReactNode;
}

export type TerminalTranscriptItemContent =
  | { kind: "command"; text: string }
  | { kind: "text"; text: string }
  | {
      kind: "status";
      level: TerminalStatusLevel;
      message: string;
      detail?: string;
      syntax?: TerminalCommandSyntax;
    }
  | { kind: "heading"; text: string }
  | { kind: "unordered-list"; items: readonly string[] }
  | { kind: "ordered-list"; items: readonly string[] }
  | { kind: "loading"; text: string }
  | { kind: "help"; rows: readonly TerminalHelpRow[] }
  | { kind: "grid"; rows: readonly TerminalGridRow[] };

export type TerminalTranscriptItem = {
  id: number;
} & TerminalTranscriptItemContent;

export interface PendingCommandDescriptor {
  kind: PendingCommandKind;
  commandText: string;
  target: string;
}

export interface PendingCommand extends PendingCommandDescriptor {
  loadingItemId: number;
}

export interface ImmediateCommandResult {
  mode: "immediate";
  items: readonly TerminalTranscriptItemContent[];
}

export interface DeferredCommandResult {
  mode: "deferred";
  pendingCommand: PendingCommandDescriptor;
  loadingItem: Extract<TerminalTranscriptItemContent, { kind: "loading" }>;
  completionItems: readonly TerminalTranscriptItemContent[];
}

export type CommandExecutionResult =
  | { mode: "reset" }
  | ImmediateCommandResult
  | DeferredCommandResult;

export interface TerminalState {
  input: string;
  items: readonly TerminalTranscriptItem[];
  history: readonly string[];
  historyIndex: number;
  nextItemId: number;
  pendingCommand: PendingCommand | null;
}

export type TerminalAction =
  | { type: TERMINAL_ACTION_TYPES.SET_INPUT; payload: string }
  | { type: TERMINAL_ACTION_TYPES.CLEAR_INPUT }
  | {
      type: TERMINAL_ACTION_TYPES.NAVIGATE_HISTORY;
      payload: HistoryDirection;
    }
  | { type: TERMINAL_ACTION_TYPES.SUBMIT_INPUT }
  | {
      type: TERMINAL_ACTION_TYPES.RESOLVE_PENDING_COMMAND;
      payload: readonly TerminalTranscriptItemContent[];
    };

export interface RootState {
  terminal: TerminalState;
}

export type InteractivePromptProps = {
  readOnly?: false;
  ref?: Ref<HTMLInputElement>;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
};

export type ReadOnlyPromptProps = {
  readOnly: true;
  value: string;
};

export type PromptProps = InteractivePromptProps | ReadOnlyPromptProps;

export interface HistoryProps {
  items: readonly TerminalTranscriptItem[];
}

export interface LineProps {
  item: TerminalTranscriptItem;
}

export interface TextProps {
  text: string;
}

export interface StatusProps {
  level: TerminalStatusLevel;
  message: string;
  detail?: string;
  syntax?: TerminalCommandSyntax;
}

export interface HeadingProps {
  text: string;
}

export interface ListProps {
  items: readonly string[];
  variant: "unordered" | "ordered";
}

export interface LoadingProps {
  text: string;
}

export interface CommandSyntaxProps {
  syntax: TerminalCommandSyntax;
}

export interface HelpGridProps {
  rows: readonly TerminalHelpRow[];
}

export interface GridProps {
  rows: readonly GridDisplayRow[];
}
