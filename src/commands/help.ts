import type { TerminalResponse } from "@types";

export const aliases = ["help"];

export const execute = (args: string[]): TerminalResponse[] => {
  if (args.length > 0) {
    return [
      {
        type: "status",
        statusType: "error",
        statusText: "Invalid arguments.",
        hintText: "Usage: help",
      },
    ];
  }
  return [{ type: "help" }];
};
