import { fireEvent, render } from "@testing-library/react";
import { useEventListener } from "../useEventListener";

type ListenerProbeProps = {
  readonly label: string;
  readonly onEvent: (label: string) => void;
};

const ListenerProbe = ({ label, onEvent }: ListenerProbeProps) => {
  useEventListener(window, "keydown", () => onEvent(label));
  return null;
};

describe("useEventListener", () => {
  it("uses the latest listener without replacing the DOM listener", () => {
    const onEvent = vi.fn();
    const { rerender } = render(
      <ListenerProbe label="first" onEvent={onEvent} />,
    );

    rerender(<ListenerProbe label="second" onEvent={onEvent} />);
    fireEvent.keyDown(window, { key: "a" });

    expect(onEvent).toHaveBeenCalledWith("second");
  });

  it("removes the listener when the component unmounts", () => {
    const onEvent = vi.fn();
    const { unmount } = render(
      <ListenerProbe label="active" onEvent={onEvent} />,
    );

    unmount();
    fireEvent.keyDown(window, { key: "a" });

    expect(onEvent).not.toHaveBeenCalled();
  });
});
