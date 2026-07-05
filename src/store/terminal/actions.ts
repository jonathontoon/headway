export const terminalActionTypes = {
  clear: "terminal/clear",
  submit: "terminal/submit",
  setCommand: "terminal/setCommand",
  navigateHistory: "terminal/navigateHistory",
} as const;

export type TerminalAction =
  | { readonly type: typeof terminalActionTypes.clear }
  | {
      readonly type: typeof terminalActionTypes.submit;
      readonly command: string;
      readonly output?: string;
    }
  | {
      readonly type: typeof terminalActionTypes.setCommand;
      readonly command: string;
    }
  | {
      readonly type: typeof terminalActionTypes.navigateHistory;
      readonly direction: "previous" | "next";
    };

export const terminalActions = {
  clear: (): TerminalAction => ({ type: terminalActionTypes.clear }),
  submit: (command: string, output?: string): TerminalAction => ({
    type: terminalActionTypes.submit,
    command,
    output,
  }),
  setCommand: (command: string): TerminalAction => ({
    type: terminalActionTypes.setCommand,
    command,
  }),
  navigateHistory: (direction: "previous" | "next"): TerminalAction => ({
    type: terminalActionTypes.navigateHistory,
    direction,
  }),
};
