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
    expect(screen.getByText(/headway v0\.1\.0/)).toBeInTheDocument();
    expect(
      screen.getByText(/Type 'help' for all available commands\./),
    ).toBeInTheDocument();
  });

  it("runs terminal task commands", () => {
    render(<App />);
    const input = screen.getByLabelText("Terminal command");

    fireEvent.change(input, { target: { value: "list +GarageSale" } });
    fireEvent.submit(input.closest("form")!);

    expect(screen.getAllByText("~$")).toHaveLength(2);
    // Command text is syntax-highlighted across multiple token spans - check textContent directly.
    const commandEl = document.querySelector(".command");
    expect(commandEl?.textContent?.trim()).toBe("list +GarageSale");
    expect(
      screen.getAllByText(/Schedule Goodwill pickup/).length,
    ).toBeGreaterThan(0);
  });

  it("clears terminal entries", () => {
    render(<App />);
    const input = screen.getByLabelText("Terminal command");
    const form = input.closest("form")!;

    fireEvent.change(input, { target: { value: "echo hello" } });
    fireEvent.submit(form);
    expect(screen.getByText("hello")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "clear" } });
    fireEvent.submit(form);
    expect(screen.queryByText("hello")).not.toBeInTheDocument();
  });

  it("reports unknown commands instead of evaluating JavaScript", () => {
    render(<App />);
    const input = screen.getByLabelText("Terminal command");

    fireEvent.change(input, { target: { value: "1 + 1" } });
    fireEvent.submit(input.closest("form")!);

    const outputEl = document.querySelectorAll(".terminal-output")[1];
    expect(outputEl?.textContent).toBe(
      "1 is not a recognized command. Type 'help' for all available commands.",
    );
  });
});
