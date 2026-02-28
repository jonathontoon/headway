import type { RootState } from "../types";

export const selectTerminalPendingCommand = (state: RootState) =>
  state.terminal.pendingCommand;
