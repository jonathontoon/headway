import { fireEvent, render } from "@testing-library/react";
import { useKeyDown } from "../useKeyDown";

type KeyDownProbeProps = {
  readonly onKeyDown: (event: KeyboardEvent) => void;
};

const KeyDownProbe = ({ onKeyDown }: KeyDownProbeProps) => {
  useKeyDown(onKeyDown);
  return null;
};

describe("useKeyDown", () => {
  it("handles keydown events from the window", () => {
    const onKeyDown = vi.fn();
    render(<KeyDownProbe onKeyDown={onKeyDown} />);

    fireEvent.keyDown(window, { key: "a" });

    expect(onKeyDown).toHaveBeenCalledWith(expect.any(KeyboardEvent));
  });
});
