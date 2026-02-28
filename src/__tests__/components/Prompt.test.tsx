// @vitest-environment jsdom
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import Prompt from "@components/Prompt";

afterEach(cleanup);

describe("Prompt", () => {
  describe("interactive mode", () => {
    it("exposes the interactive prompt input with an accessible name", () => {
      render(<Prompt value="" onChange={() => {}} onKeyDown={() => {}} />);

      expect(
        screen.getByRole("textbox", { name: "Terminal command" })
      ).toBeInTheDocument();
    });

    it("calls onChange when input value changes", () => {
      const onChange = vi.fn();
      render(<Prompt value="" onChange={onChange} onKeyDown={() => {}} />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "list" } });

      expect(onChange).toHaveBeenCalledTimes(1);
      const event = onChange.mock.calls[0][0];
      expect(event.target).toBeDefined();
    });

    it("calls onKeyDown when a key is pressed", () => {
      const onKeyDown = vi.fn();
      render(
        <Prompt value="" onChange={() => {}} onKeyDown={onKeyDown} />
      );

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

      expect(onKeyDown).toHaveBeenCalled();
    });

    it("displays the current input value", () => {
      render(<Prompt value="test command" onChange={() => {}} onKeyDown={() => {}} />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("test command");
    });

    it("renders the prompt prefix with prompt color", () => {
      render(<Prompt value="" onChange={() => {}} onKeyDown={() => {}} />);

      const prefix = screen.getByText("$");
      expect(prefix).toHaveClass("text-terminal-prompt");
    });
  });

  describe("read-only mode", () => {
    it("renders read-only prompts without an interactive input", () => {
      render(<Prompt readOnly value="list" />);

      expect(screen.queryByRole("textbox")).toBeNull();
      expect(screen.getByText("list")).toBeInTheDocument();
    });

    it("displays the value as static text in read-only mode", () => {
      render(<Prompt readOnly value="executed command" />);

      expect(screen.getByText("executed command")).toBeInTheDocument();
      expect(screen.queryByRole("textbox")).toBeNull();
    });

    it("renders the prompt prefix in read-only mode", () => {
      render(<Prompt readOnly value="test" />);

      const prefix = screen.getByText("$");
      expect(prefix).toHaveClass("text-terminal-prompt");
    });
  });
});
