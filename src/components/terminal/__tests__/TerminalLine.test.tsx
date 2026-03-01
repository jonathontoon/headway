import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  TERMINAL_COMMAND_SIGNATURES,
  TERMINAL_HELP_ROWS,
} from "../../../constants";
import type { TerminalLineProps } from "../../../types";
import TerminalLine from "../TerminalLine";

type TerminalLineCase = {
  name: string;
  item: TerminalLineProps["item"];
  assertRendered: () => void;
};

const cases: readonly TerminalLineCase[] = [
  {
    name: "command",
    item: { id: 1, kind: "command", text: "help" },
    assertRendered: () => {
      expect(screen.getByText("help")).toBeInTheDocument();
      expect(screen.queryByRole("textbox")).toBeNull();
    },
  },
  {
    name: "text",
    item: { id: 2, kind: "text", text: "plain output" },
    assertRendered: () => {
      expect(screen.getByText("plain output")).toBeInTheDocument();
    },
  },
  {
    name: "status",
    item: {
      id: 3,
      kind: "status",
      level: "error",
      message: "usage:",
      signature: TERMINAL_COMMAND_SIGNATURES.status,
    },
    assertRendered: () => {
      expect(screen.getByText("[×]")).toBeInTheDocument();
      expect(screen.getByText("<success|warning|error>")).toBeInTheDocument();
    },
  },
  {
    name: "heading",
    item: { id: 4, kind: "heading", text: "Queued jobs" },
    assertRendered: () => {
      expect(screen.getByText("Queued jobs")).toBeInTheDocument();
    },
  },
  {
    name: "unordered-list",
    item: { id: 5, kind: "unordered-list", items: ["first task"] },
    assertRendered: () => {
      expect(screen.getByText("first task").closest("ul")).not.toBeNull();
      expect(screen.getByText("•")).toBeInTheDocument();
    },
  },
  {
    name: "ordered-list",
    item: { id: 6, kind: "ordered-list", items: ["first step"] },
    assertRendered: () => {
      expect(screen.getByText("first step").closest("ol")).not.toBeNull();
      expect(screen.getByText("1.")).toBeInTheDocument();
    },
  },
  {
    name: "loading",
    item: { id: 7, kind: "loading", text: "Deploying..." },
    assertRendered: () => {
      expect(screen.getByText("Deploying...")).toBeInTheDocument();
      expect(screen.getByText("●")).toHaveClass("animate-terminal-blink");
    },
  },
  {
    name: "help",
    item: { id: 8, kind: "help", rows: TERMINAL_HELP_ROWS },
    assertRendered: () => {
      expect(screen.getByText("show the command palette")).toBeInTheDocument();
    },
  },
  {
    name: "grid",
    item: {
      id: 9,
      kind: "grid",
      rows: [{ label: "Service", value: "healthy" }],
    },
    assertRendered: () => {
      expect(screen.getByText("Service")).toHaveClass("text-terminal-text");
      expect(screen.getByText("healthy")).toHaveClass("text-terminal-muted");
    },
  },
];

describe("TerminalLine", () => {
  it.each(cases)("renders $name items", ({ item, assertRendered }) => {
    render(<TerminalLine item={item} />);

    assertRendered();
  });

  it("throws for unknown transcript item kinds", () => {
    const item = {
      id: 10,
      kind: "mystery",
    } as unknown as TerminalLineProps["item"];

    expect(() => render(<TerminalLine item={item} />)).toThrow(
      /Unhandled terminal transcript item/
    );
  });
});
