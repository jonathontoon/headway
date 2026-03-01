import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TerminalList from "../TerminalList";

describe("TerminalList", () => {
  it("renders an unordered list of terminal items", () => {
    const { container } = render(
      <TerminalList items={["first task", "second task"]} variant="unordered" />
    );
    const list = container.firstElementChild as HTMLElement;

    expect(list.tagName).toBe("UL");
    expect(within(list).getAllByText("•")).toHaveLength(2);
    expect(within(list).getByText("first task")).toBeInTheDocument();
    expect(within(list).getByText("second task")).toBeInTheDocument();
  });

  it("renders an ordered list of terminal items", () => {
    const { container } = render(
      <TerminalList items={["first step", "second step"]} variant="ordered" />
    );
    const list = container.firstElementChild as HTMLElement;

    expect(list.tagName).toBe("OL");
    expect(within(list).getByText("1.")).toBeInTheDocument();
    expect(within(list).getByText("2.")).toBeInTheDocument();
    expect(within(list).getByText("first step")).toBeInTheDocument();
    expect(within(list).getByText("second step")).toBeInTheDocument();
  });
});
