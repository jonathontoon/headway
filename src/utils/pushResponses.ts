import type { TerminalResponse } from "../types/terminal-response";

interface TerminalActions {
  addResponse: (responses: TerminalResponse[]) => void;
  reset: () => void;
}

const pushResponses = (
  actions: TerminalActions,
  responses: TerminalResponse[]
): void => {
  if (responses.some((r) => r.type === "clear")) {
    actions.reset();
  } else {
    actions.addResponse(responses);
  }
};

export default pushResponses;
