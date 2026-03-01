import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Text from "../Text";

describe("Text", () => {
  it("renders terminal text with preserved wrapping classes", () => {
    const { container } = render(<Text text={"ready\nsteady"} />);
    const wrapper = container.firstElementChild;

    expect(wrapper).toHaveTextContent("ready steady");
    expect(wrapper).toHaveClass("wrap-break-word");
    expect(wrapper).toHaveClass("whitespace-pre-wrap");
    expect(wrapper).toHaveClass("text-terminal-text");
  });
});
