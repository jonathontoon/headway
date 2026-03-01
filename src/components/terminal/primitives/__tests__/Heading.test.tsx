import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Heading from "../Heading";

describe("Heading", () => {
  it("renders terminal labels as a tagged terminal label", () => {
    const { container } = render(<Heading text="jobs" />);
    const label = screen.getByText("jobs");
    const wrapper = container.firstElementChild;

    expect(label).toBeInTheDocument();
    expect(wrapper).toHaveClass("inline-flex");
    expect(wrapper).toHaveClass("text-terminal-text");
    expect(wrapper).not.toHaveClass("text-xs");
    expect(label).toHaveClass("bg-terminal-info");
    expect(label).toHaveClass("text-terminal-background");
    expect(
      screen.queryByRole("heading", { name: "jobs" })
    ).not.toBeInTheDocument();
    expect(container.querySelector(".bg-terminal-border")).toBeNull();
  });
});
