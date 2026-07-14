import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import { SAMPLE_TODOS } from "./store/todos/storage";

function renderApp() {
  return render(<App initialTodos={SAMPLE_TODOS} />);
}

describe("App Component", () => {

  it("renders an editable terminal prompt", () => {
    renderApp();
    expect(screen.getByLabelText("Terminal prompt")).toBeInTheDocument();
    expect(screen.getByLabelText("Terminal command")).toHaveFocus();
    const bootOutput = document.querySelector(
      '[data-testid="terminal-output"]',
    );
    expect(bootOutput?.textContent).toContain("headway v1.5.0");
    expect(bootOutput?.textContent).toContain(
      "Type 'help' for all available commands.",
    );
  });

  it("focuses the command input from the command capture area", () => {
    renderApp();
    const input = screen.getByLabelText("Terminal command");

    input.blur();
    fireEvent.pointerDown(screen.getByTestId("terminal-command-capture"), {
      button: 0,
      clientX: 0,
      pointerType: "touch",
    });

    expect(input).toHaveFocus();
  });

  it("runs terminal task commands", () => {
    renderApp();
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
    renderApp();
    const input = screen.getByLabelText("Terminal command");

    fireEvent.change(input, { target: { value: "1 + 1" } });
    fireEvent.submit(input.closest("form")!);

    const outputEl = document.querySelectorAll(
      '[data-testid="terminal-output"]',
    )[1];
    expect(outputEl?.textContent).toBe(
      " → 1 is not a recognized command. Type 'help' for all available commands.",
    );
  });
});
