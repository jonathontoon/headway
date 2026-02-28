// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import Prompt from "@components/terminal/Prompt";

afterEach(cleanup);

describe("Prompt", () => {
  it("renders an interactive input and forwards events", () => {
    const onChange = vi.fn();
    const onKeyDown = vi.fn();

    render(<Prompt value="list" onChange={onChange} onKeyDown={onKeyDown} />);

    const input = screen.getByRole("textbox", { name: "Terminal command" });
    fireEvent.change(input, { target: { value: "add" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect((input as HTMLInputElement).value).toBe("list");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it("renders read-only prompts without an input", () => {
    render(<Prompt readOnly value="help" />);

    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("help")).toBeInTheDocument();
  });
});
