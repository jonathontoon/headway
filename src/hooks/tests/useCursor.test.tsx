import { act, renderHook } from "@testing-library/react";
import { useCursor } from "../useCursor";

describe("useCursor", () => {
  it("syncs its segments with the input selection", () => {
    const { result } = renderHook(() => useCursor("abcd"));
    const input = document.createElement("input");
    input.value = "abcd";
    document.body.append(input);
    result.current.inputRef.current = input;
    input.setSelectionRange(2, 2);

    act(() => {
      result.current.syncCursorPosition();
    });

    expect(result.current.before).toBe("ab");
    expect(result.current.charUnderCursor).toBe("c");
    expect(result.current.after).toBe("d");

    input.remove();
  });

  it("places the cursor from a client x position", () => {
    const { result } = renderHook(() => useCursor("abcd"));
    const container = document.createElement("div");
    const input = document.createElement("input");
    const commandText = document.createElement("span");
    const commandMeasurement = document.createElement("span");
    input.value = "abcd";
    container.append(input, commandText, commandMeasurement);
    document.body.append(container);
    result.current.inputRef.current = input;
    result.current.commandTextRef.current = commandText;
    result.current.commandMeasurementRef.current = commandMeasurement;

    vi.spyOn(commandText, "getBoundingClientRect").mockReturnValue({
      left: 10,
      width: 40,
    } as DOMRect);
    vi.spyOn(commandMeasurement, "getBoundingClientRect").mockReturnValue({
      left: 10,
      width: 40,
    } as DOMRect);

    act(() => {
      result.current.setCursorPositionFromClientX(35);
    });

    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(3);
    expect(result.current.before).toBe("abc");
    expect(result.current.charUnderCursor).toBe("d");
    expect(result.current.after).toBe("");

    container.remove();
  });
});
