import { describe, expect, it } from "vitest";
import { parseCommand } from "@reducers/terminal/terminalParser";

describe("parseCommand", () => {
  it("parses valid commands into structured shapes", () => {
    expect(parseCommand("help")).toEqual({ ok: true, command: { type: "help" } });
    expect(parseCommand("add Write tests")).toEqual({
      ok: true,
      command: { type: "add", title: "Write tests" },
    });
    expect(parseCommand("move 2 today")).toEqual({
      ok: true,
      command: { type: "move", target: "2", bucket: "today" },
    });
    expect(parseCommand("priority task-id none")).toEqual({
      ok: true,
      command: { type: "priority", target: "task-id", priority: null },
    });
  });

  it("returns explicit validation errors for bad input", () => {
    expect(parseCommand("")).toEqual({ ok: false, error: "Enter a command." });
    expect(parseCommand("add")).toEqual({
      ok: false,
      error: "usage: add <title>",
    });
    expect(parseCommand("due 1 tomorrow")).toEqual({
      ok: false,
      error: "due date must be YYYY-MM-DD or none",
    });
    expect(parseCommand("wat")).toEqual({
      ok: false,
      error: "wat: command not found",
    });
  });
});
