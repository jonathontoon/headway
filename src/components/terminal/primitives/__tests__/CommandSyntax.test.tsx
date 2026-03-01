import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TERMINAL_COMMAND_SYNTAXES } from "../../../../constants";
import CommandSyntax from "../CommandSyntax";

describe("CommandSyntax", () => {
  it("renders command names and argument tokens with semantic colors", () => {
    render(
      <CommandSyntax
        syntax={TERMINAL_COMMAND_SYNTAXES.status}
      />
    );

    expect(screen.getByText("status")).toHaveClass("text-terminal-text");
    expect(screen.getByText("<success|warning|error>")).toHaveClass(
      "text-cyan-300"
    );
    expect(screen.getByText("<message>")).toHaveClass("text-yellow-200");
    expect(screen.getByText("status")).not.toHaveClass("text-cyan-300");
    expect(screen.getByText("status")).not.toHaveClass("text-yellow-200");
  });
});
