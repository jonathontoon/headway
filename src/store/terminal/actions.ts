import type { TerminalOutput } from "./output";

export type TerminalAction =
  | { readonly type: "clearScreen" }
  | { readonly type: "cancel" }
  | { readonly type: "endPending" }
  | {
      readonly type: "cancelPending";
      readonly output: TerminalOutput;
    }
  | {
      readonly type: "submit";
      readonly command: string;
      readonly output?: TerminalOutput | undefined;
      readonly todos: readonly string[];
      readonly view: readonly number[];
      readonly pending: boolean;
    }
  | {
      readonly type: "appendOutput";
      readonly output: TerminalOutput;
    }
  | {
      readonly type: "replaceLastOutput";
      readonly output: TerminalOutput;
    }
  | {
      readonly type: "applyTodos";
      readonly todos: readonly string[];
    }
  | {
      readonly type: "setCommand";
      readonly command: string;
    }
  | {
      readonly type: "navigateHistory";
      readonly direction: "previous" | "next";
    };

export const terminalActions = {
  clearScreen: (): TerminalAction => ({ type: "clearScreen" }),
  cancel: (): TerminalAction => ({ type: "cancel" }),
  endPending: (): TerminalAction => ({ type: "endPending" }),
  cancelPending: (output: TerminalOutput): TerminalAction => ({
    type: "cancelPending",
    output,
  }),
  submit: (
    command: string,
    output: TerminalOutput | undefined,
    todos: readonly string[],
    view: readonly number[],
    pending: boolean,
  ): TerminalAction => ({
    type: "submit",
    command,
    output,
    todos,
    view,
    pending,
  }),
  appendOutput: (output: TerminalOutput): TerminalAction => ({
    type: "appendOutput",
    output,
  }),
  replaceLastOutput: (output: TerminalOutput): TerminalAction => ({
    type: "replaceLastOutput",
    output,
  }),
  applyTodos: (todos: readonly string[]): TerminalAction => ({
    type: "applyTodos",
    todos,
  }),
  setCommand: (command: string): TerminalAction => ({
    type: "setCommand",
    command,
  }),
  navigateHistory: (direction: "previous" | "next"): TerminalAction => ({
    type: "navigateHistory",
    direction,
  }),
};
