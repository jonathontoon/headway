import type {
  TerminalAction,
  TerminalEvent,
  TranscriptEntry,
  TranscriptStatus,
} from "@reducers/terminal/terminalTypes";

export const setInput = (value: string): TerminalAction => ({
  type: "terminal/setInput",
  value,
});

export const appendEntry = (entry: TranscriptEntry): TerminalAction => ({
  type: "terminal/appendEntry",
  entry,
});

export const resolveEntry = (
  entryId: string,
  status: TranscriptStatus,
  events: readonly TerminalEvent[]
): TerminalAction => ({
  type: "terminal/resolveEntry",
  entryId,
  status,
  events,
});

export const recordCommand = (command: string): TerminalAction => ({
  type: "terminal/recordCommand",
  command,
});

export const navigateHistory = (
  direction: "up" | "down"
): TerminalAction => ({
  type: "terminal/navigateHistory",
  direction,
});

export const clearTerminal = (): TerminalAction => ({
  type: "terminal/clear",
});
