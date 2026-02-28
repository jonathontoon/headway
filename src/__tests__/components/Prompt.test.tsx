// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import Prompt from "@components/Prompt";

afterEach(cleanup);

describe("Prompt", () => {
  it("exposes the interactive prompt input with an accessible name", () => {
    render(<Prompt value="" onChange={() => {}} onKeyDown={() => {}} />);

    expect(
      screen.getByRole("textbox", { name: "Terminal command" })
    ).toBeInTheDocument();
  });

  it("renders read-only prompts without an interactive input", () => {
    render(<Prompt readOnly value="list" />);

    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("list")).toBeInTheDocument();
  });
});
