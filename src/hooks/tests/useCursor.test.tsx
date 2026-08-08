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

  it("falls back to horizontal approximation when no caret hit-testing API exists", () => {
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
      right: 50,
      top: 0,
      bottom: 20,
    } as DOMRect);

    act(() => {
      result.current.setCursorPositionFromPoint(35, 10);
    });

    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(3);
    expect(result.current.before).toBe("abc");
    expect(result.current.charUnderCursor).toBe("d");
    expect(result.current.after).toBe("");

    container.remove();
  });

  it("places the cursor using caretRangeFromPoint hit-testing when available", () => {
    const { result } = renderHook(() => useCursor("abcd"));
    const container = document.createElement("div");
    const input = document.createElement("input");
    const commandText = document.createElement("span");
    const commandMeasurement = document.createElement("span");
    input.value = "abcd";
    const measurementText = document.createTextNode("abcd");
    commandMeasurement.append(measurementText);
    container.append(input, commandText, commandMeasurement);
    document.body.append(container);
    result.current.inputRef.current = input;
    result.current.commandTextRef.current = commandText;
    result.current.commandMeasurementRef.current = commandMeasurement;

    vi.spyOn(commandMeasurement, "getBoundingClientRect").mockReturnValue({
      left: 10,
      width: 40,
      right: 50,
      top: 0,
      bottom: 20,
    } as DOMRect);

    const caretRangeFromPoint = vi.fn().mockReturnValue({
      startContainer: measurementText,
      startOffset: 2,
    });
    Object.defineProperty(document, "caretRangeFromPoint", {
      value: caretRangeFromPoint,
      configurable: true,
    });

    act(() => {
      result.current.setCursorPositionFromPoint(30, 10);
    });

    expect(caretRangeFromPoint).toHaveBeenCalled();
    expect(input.selectionStart).toBe(2);
    expect(result.current.before).toBe("ab");
    expect(result.current.charUnderCursor).toBe("c");
    expect(result.current.after).toBe("d");

    Reflect.deleteProperty(document, "caretRangeFromPoint");
    container.remove();
  });

  it("falls back to approximation when the caret hit lands outside the mirror", () => {
    const { result } = renderHook(() => useCursor("abcd"));
    const container = document.createElement("div");
    const input = document.createElement("input");
    const commandText = document.createElement("span");
    const commandMeasurement = document.createElement("span");
    input.value = "abcd";
    commandMeasurement.append(document.createTextNode("abcd"));
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
      right: 50,
      top: 0,
      bottom: 20,
    } as DOMRect);

    const caretRangeFromPoint = vi.fn().mockReturnValue({
      startContainer: document.body,
      startOffset: 0,
    });
    Object.defineProperty(document, "caretRangeFromPoint", {
      value: caretRangeFromPoint,
      configurable: true,
    });

    act(() => {
      result.current.setCursorPositionFromPoint(35, 10);
    });

    expect(input.selectionStart).toBe(3);

    Reflect.deleteProperty(document, "caretRangeFromPoint");
    container.remove();
  });

  it("maps a caret hit on the mirror element itself to the nearest end", () => {
    const { result } = renderHook(() => useCursor("abcd"));
    const container = document.createElement("div");
    const input = document.createElement("input");
    const commandText = document.createElement("span");
    const commandMeasurement = document.createElement("span");
    input.value = "abcd";
    commandMeasurement.append(document.createTextNode("abcd"));
    container.append(input, commandText, commandMeasurement);
    document.body.append(container);
    result.current.inputRef.current = input;
    result.current.commandTextRef.current = commandText;
    result.current.commandMeasurementRef.current = commandMeasurement;

    vi.spyOn(commandMeasurement, "getBoundingClientRect").mockReturnValue({
      left: 10,
      width: 40,
      right: 50,
      top: 0,
      bottom: 20,
    } as DOMRect);

    const caretRangeFromPoint = vi.fn().mockReturnValue({
      startContainer: commandMeasurement,
      startOffset: 1,
    });
    Object.defineProperty(document, "caretRangeFromPoint", {
      value: caretRangeFromPoint,
      configurable: true,
    });

    act(() => {
      result.current.setCursorPositionFromPoint(49, 10);
    });

    expect(input.selectionStart).toBe(4);

    Reflect.deleteProperty(document, "caretRangeFromPoint");
    container.remove();
  });
});
