import type {
  TerminalAction,
  TerminalState,
} from "@reducers/terminal/terminalTypes";

export const createTerminalState = (
  transcript: TerminalState["transcript"] = []
): TerminalState => ({
  input: "",
  transcript,
  commandHistory: [],
  historyIndex: -1,
  pendingCommandId: null,
});

export const terminalReducer = (
  state: TerminalState,
  action: TerminalAction
): TerminalState => {
  switch (action.type) {
    case "terminal/setInput":
      return {
        ...state,
        input: action.value,
      };
    case "terminal/appendEntry":
      return {
        ...state,
        transcript: [...state.transcript, action.entry],
        pendingCommandId:
          action.entry.status === "pending" ? action.entry.id : state.pendingCommandId,
      };
    case "terminal/resolveEntry":
      return {
        ...state,
        transcript: state.transcript.map((entry) =>
          entry.id === action.entryId
            ? {
                ...entry,
                status: action.status,
                events: action.events,
              }
            : entry
        ),
        input: "",
        historyIndex: -1,
        pendingCommandId:
          state.pendingCommandId === action.entryId ? null : state.pendingCommandId,
      };
    case "terminal/recordCommand":
      return {
        ...state,
        commandHistory: [action.command, ...state.commandHistory],
      };
    case "terminal/navigateHistory": {
      if (action.direction === "up") {
        const nextIndex = Math.min(
          state.historyIndex + 1,
          state.commandHistory.length - 1
        );

        return {
          ...state,
          historyIndex: nextIndex,
          input: state.commandHistory[nextIndex] ?? "",
        };
      }

      const nextIndex = state.historyIndex - 1;
      if (nextIndex < 0) {
        return {
          ...state,
          historyIndex: -1,
          input: "",
        };
      }

      return {
        ...state,
        historyIndex: nextIndex,
        input: state.commandHistory[nextIndex] ?? "",
      };
    }
    case "terminal/clear":
      return createTerminalState();
    default: {
      const exhaustiveCheck: never = action;
      throw new Error(`Unhandled terminal action: ${exhaustiveCheck}`);
    }
  }
};
