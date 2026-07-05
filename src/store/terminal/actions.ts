export const terminalActionTypes = {
  clear: "terminal/clear",
  submit: "terminal/submit",
  setCommand: "terminal/setCommand",
  navigateHistory: "terminal/navigateHistory",
  hydrateTodos: "terminal/hydrateTodos",
} as const;

export type TerminalAction =
  | { readonly type: typeof terminalActionTypes.clear }
  | {
      readonly type: typeof terminalActionTypes.submit;
      readonly command: string;
      readonly output?: string;
      readonly todos: readonly string[];
    }
  | {
      readonly type: typeof terminalActionTypes.setCommand;
      readonly command: string;
    }
  | {
      readonly type: typeof terminalActionTypes.navigateHistory;
      readonly direction: "previous" | "next";
    }
  | {
      readonly type: typeof terminalActionTypes.hydrateTodos;
      readonly todos: readonly string[];
    };

export const terminalActions = {
  clear: (): TerminalAction => ({ type: terminalActionTypes.clear }),
  submit: (
    command: string,
    output: string | undefined,
    todos: readonly string[],
  ): TerminalAction => ({
    type: terminalActionTypes.submit,
    command,
    output,
    todos,
  }),
  setCommand: (command: string): TerminalAction => ({
    type: terminalActionTypes.setCommand,
    command,
  }),
  navigateHistory: (direction: "previous" | "next"): TerminalAction => ({
    type: terminalActionTypes.navigateHistory,
    direction,
  }),
  hydrateTodos: (todos: readonly string[]): TerminalAction => ({
    type: terminalActionTypes.hydrateTodos,
    todos,
  }),
};
