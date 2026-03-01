// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { TERMINAL_INPUT_LABEL } from "../../../constants";
import Prompt from "../Prompt";

describe("Prompt", () => {
  it("renders an interactive input and forwards events", () => {
    const onChange = vi.fn();
    const onKeyDown = vi.fn();

    render(<Prompt value="list" onChange={onChange} onKeyDown={onKeyDown} />);

    const input = screen.getByRole("textbox", { name: TERMINAL_INPUT_LABEL });
    const tilde = screen.getByText("~");
    const dollar = screen.getByText("$");
    const caret = screen.getByTestId("prompt-caret");

    expect(input).toHaveFocus();

    fireEvent.change(input, { target: { value: "add" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect((input as HTMLInputElement).value).toBe("list");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(tilde).toHaveClass("text-cyan-300");
    expect(dollar).toHaveClass("text-white");
    expect(caret).toHaveClass("animate-terminal-blink");
    expect(caret).toHaveClass("bg-white");
    expect(screen.queryByText("❯")).toBeNull();

    input.setSelectionRange(1, 1);
    fireEvent.keyUp(input, { key: "ArrowLeft", code: "ArrowLeft" });

    expect(screen.getByTestId("prompt-caret")).toHaveTextContent("i");

    input.setSelectionRange(1, 2);
    fireEvent.select(input);

    expect(screen.queryByTestId("prompt-caret")).toBeNull();
  });

  it("autofocuses the interactive prompt on render", () => {
    render(<Prompt value="list" onChange={vi.fn()} onKeyDown={vi.fn()} />);

    expect(
      screen.getByRole("textbox", { name: TERMINAL_INPUT_LABEL })
    ).toHaveFocus();
  });

  it("forwards the input ref and renders a non-breaking caret placeholder", () => {
    const ref = createRef<HTMLInputElement>();

    render(
      <Prompt ref={ref} value="done" onChange={vi.fn()} onKeyDown={vi.fn()} />
    );

    expect(ref.current).toBeInstanceOf(HTMLInputElement);

    ref.current?.setSelectionRange(
      ref.current.value.length,
      ref.current.value.length
    );
    fireEvent.keyUp(ref.current as HTMLInputElement, {
      key: "ArrowRight",
      code: "ArrowRight",
    });

    expect(screen.getByTestId("prompt-caret").textContent).toBe("\u00A0");
  });

  it("renders read-only prompts without an input", () => {
    render(<Prompt readOnly value="help" />);

    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("~")).toHaveClass("text-cyan-300");
    expect(screen.getByText("$")).toHaveClass("text-white");
    expect(screen.getByText("help")).toBeInTheDocument();
    expect(screen.queryByTestId("prompt-caret")).toBeNull();
    expect(screen.queryByText("\u00A0")).not.toBeInTheDocument();
    expect(screen.queryByText("❯")).toBeNull();
  });
});
