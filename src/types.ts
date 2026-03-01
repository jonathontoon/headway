import type { ChangeEvent, KeyboardEvent, ReactNode, Ref } from "react";
import { TERMINAL_ACTION_TYPES } from "./constants";

export type TerminalStatusLevel = "error" | "warning" | "success";
export type HistoryDirection = "up" | "down";
export type PendingCommandKind = "deploy";

export type TerminalCommandSignatureArgument =
  | { kind: "choice"; options: readonly string[] }
  | { kind: "value"; name: string };

export interface TerminalCommandSignature {
  command: string;
  arguments?: readonly TerminalCommandSignatureArgument[];
}

export interface TerminalHelpRow {
  signature: TerminalCommandSignature;
  description: string;
}

export interface TerminalGridRow {
  label: string;
  value: string;
}

export interface TerminalGridDisplayRow {
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
      signature?: TerminalCommandSignature;
    }
  | { kind: "heading"; text: string }
  | { kind: "list"; items: readonly string[] }
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

export interface TerminalHistoryProps {
  items: readonly TerminalTranscriptItem[];
}

export interface TerminalLineProps {
  item: TerminalTranscriptItem;
}

export interface TerminalTextProps {
  text: string;
}

export interface TerminalStatusProps {
  level: TerminalStatusLevel;
  message: string;
  detail?: string;
  signature?: TerminalCommandSignature;
}

export interface TerminalHeadingProps {
  text: string;
}

export interface TerminalListProps {
  items: readonly string[];
}

export interface TerminalLoadingProps {
  text: string;
}

export interface TerminalCommandSignatureProps {
  signature: TerminalCommandSignature;
}

export interface TerminalHelpGridProps {
  rows: readonly TerminalHelpRow[];
}

export interface TerminalGridProps {
  rows: readonly TerminalGridDisplayRow[];
}
