import type { RootState } from "../types";

export const selectTerminalItems = (state: RootState) => state.terminal.items;
