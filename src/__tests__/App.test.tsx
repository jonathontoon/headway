import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../components/terminal/Terminal", () => ({
  default: () => <div data-testid="terminal-mock">terminal</div>,
}));

import App from "../App";

describe("App", () => {
  it("renders the terminal inside the full-height app shell", () => {
    const { container } = render(<App />);
    const wrapper = container.firstElementChild;

    expect(wrapper).toHaveClass("h-dvh");
    expect(wrapper).toHaveClass("w-full");
    expect(screen.getByTestId("terminal-mock")).toBeInTheDocument();
  });
});
