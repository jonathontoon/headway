export type TerminalAction =
  | { readonly type: "clearScreen" }
  | { readonly type: "cancel" }
  | {
      readonly type: "submit";
      readonly command: string;
      readonly output?: string;
      readonly todos: readonly string[];
      readonly view: readonly number[];
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
  submit: (
    command: string,
    output: string | undefined,
    todos: readonly string[],
    view: readonly number[],
  ): TerminalAction => ({
    type: "submit",
    command,
    output,
    todos,
    view,
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
