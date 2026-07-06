import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

describe("App Component", () => {
  beforeEach(() => {
    localStorage.removeItem("headway-todos");
  });

  it("renders an editable terminal prompt", () => {
    render(<App />);
    expect(screen.getByLabelText("Terminal prompt")).toBeInTheDocument();
    expect(screen.getByLabelText("Terminal command")).toHaveFocus();
    const bootOutput = document.querySelector(
      '[data-testid="terminal-output"]',
    );
    expect(bootOutput?.textContent).toContain("headway v0.14.1");
    expect(bootOutput?.textContent).toContain(
      "Type 'help' for all available commands.",
    );
  });

  it("runs terminal task commands", () => {
    render(<App />);
    const input = screen.getByLabelText("Terminal command");

    fireEvent.change(input, { target: { value: "list +GarageSale" } });
    fireEvent.submit(input.closest("form")!);

    const promptEls = document.querySelectorAll('[data-testid="prompt"]');
    expect(promptEls).toHaveLength(2);
    promptEls.forEach((el) => expect(el.textContent).toBe("~$"));
    const commandEl = document.querySelector('[data-testid="command"]');
    expect(commandEl?.textContent?.trim()).toBe("list +GarageSale");
    expect(
      screen.getAllByText(/Schedule Goodwill pickup/).length,
    ).toBeGreaterThan(0);
  });

  it("reports unknown commands instead of evaluating JavaScript", () => {
    render(<App />);
    const input = screen.getByLabelText("Terminal command");

    fireEvent.change(input, { target: { value: "1 + 1" } });
    fireEvent.submit(input.closest("form")!);

    const outputEl = document.querySelectorAll(
      '[data-testid="terminal-output"]',
    )[1];
    expect(outputEl?.textContent).toBe(
      "→ 1 is not a recognized command. Type 'help' for all available commands.",
    );
  });

  it("renders theme test colors", () => {
    render(<App />);
    const input = screen.getByLabelText("Terminal command");
    const form = input.closest("form")!;

    fireEvent.change(input, { target: { value: "theme set hyper" } });
    fireEvent.submit(form);
    fireEvent.change(input, { target: { value: "theme test" } });
    fireEvent.submit(form);

    expect(screen.getByTestId("color1")).toHaveClass("text-terminal-1");
    expect(screen.getByTestId("color11")).toHaveClass("text-terminal-11");
    expect(screen.getByText("background")).toBeInTheDocument();
  });
});
