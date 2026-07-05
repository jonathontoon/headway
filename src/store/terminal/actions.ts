export type TerminalAction =
  | { readonly type: "clear" }
  | {
      readonly type: "submit";
      readonly command: string;
      readonly output?: string;
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
  clear: (): TerminalAction => ({ type: "clear" }),
  submit: (
    command: string,
    output: string | undefined,
    todos: readonly string[],
  ): TerminalAction => ({
    type: "submit",
    command,
    output,
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
