import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  TERMINAL_COMMAND_PALETTE_COMMANDS,
  TERMINAL_COMMAND_PALETTE_TITLE,
} from "../../../../constants";
import TerminalCommandPalette from "../TerminalCommandPalette";

describe("TerminalCommandPalette", () => {
  it("renders the command title and command descriptions", () => {
    render(
      <TerminalCommandPalette commands={TERMINAL_COMMAND_PALETTE_COMMANDS} />
    );

    expect(screen.getByText(TERMINAL_COMMAND_PALETTE_TITLE)).toBeInTheDocument();
    expect(screen.getByText(TERMINAL_COMMAND_PALETTE_COMMANDS[0].name)).toBeInTheDocument();
    expect(
      screen.getByText(TERMINAL_COMMAND_PALETTE_COMMANDS[0].description)
    ).toBeInTheDocument();
  });
});
