import type { RootState } from "../types";

export const selectTerminalInput = (state: RootState) => state.terminal.input;
