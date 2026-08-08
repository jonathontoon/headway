import { useEffect, useLayoutEffect, useRef, useState } from "react";

const CURSOR_BLINK_RESUME_DELAY_MS = 500;

/**
 * Manages the custom terminal cursor and its text measurement refs.
 *
 * @param command - Current command text.
 * @returns Refs, cursor text parts, and cursor control handlers.
 */
export function useCursor(command: string) {
  const inputRef = useRef<HTMLInputElement>(null);
  const commandTextRef = useRef<HTMLSpanElement>(null);
  const commandMeasurementRef = useRef<HTMLSpanElement>(null);
  const [cursorPosition, setCursorPosition] = useState(command.length);
  const [isCursorBlinking, setIsCursorBlinking] = useState(true);
  const resumeBlinkTimeoutRef =
    useRef<ReturnType<typeof setTimeout>>(undefined);
  const isInitialRenderRef = useRef(true);

  function pauseCursorBlink() {
    setIsCursorBlinking(false);
    clearTimeout(resumeBlinkTimeoutRef.current);
    resumeBlinkTimeoutRef.current = setTimeout(() => {
      setIsCursorBlinking(true);
    }, CURSOR_BLINK_RESUME_DELAY_MS);
  }

  function resumeCursorBlinkImmediately() {
    clearTimeout(resumeBlinkTimeoutRef.current);
    setIsCursorBlinking(true);
  }

  useEffect(() => {
    return () => clearTimeout(resumeBlinkTimeoutRef.current);
  }, []);

  function syncCursorPosition() {
    setCursorPosition(inputRef.current?.selectionStart ?? 0);
    pauseCursorBlink();
  }

  function approximateCharOffsetFromClientX(
    clientX: number,
    commandText: HTMLElement,
    commandMeasurement: HTMLElement,
    textLength: number,
  ): number {
    const textRect = commandText.getBoundingClientRect();
    const measurementRect = commandMeasurement.getBoundingClientRect();
    const measuredLength = Math.max(textLength, 1);
    const charWidth = measurementRect.width / measuredLength;
    return charWidth > 0
      ? Math.max(
          0,
          Math.min(
            textLength,
            Math.round((clientX - textRect.left) / charWidth),
          ),
        )
      : textLength;
  }

  /**
   * Resolves a client-space point to a character offset within `mirror`'s
   * text content, using the browser's own caret hit-testing so wrapped
   * lines resolve correctly. Returns null if neither hit-testing API is
   * available, or the hit doesn't land inside `mirror`.
   */
  function resolveCharOffsetFromPoint(
    clientX: number,
    clientY: number,
    mirror: HTMLElement,
    textLength: number,
  ): number | null {
    const rect = mirror.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return null;
    }

    const x = Math.min(Math.max(clientX, rect.left), rect.right - 0.5);
    const y = Math.min(Math.max(clientY, rect.top), rect.bottom - 0.5);

    const hit: { node: Node; offset: number } | null = (() => {
      if (typeof document.caretRangeFromPoint === "function") {
        const range = document.caretRangeFromPoint(x, y);
        return range
          ? { node: range.startContainer, offset: range.startOffset }
          : null;
      }

      if (typeof document.caretPositionFromPoint === "function") {
        const position = document.caretPositionFromPoint(x, y);
        return position
          ? { node: position.offsetNode, offset: position.offset }
          : null;
      }

      return null;
    })();

    if (!hit) {
      return null;
    }

    const { node, offset } = hit;

    if (!mirror.contains(node)) {
      return null;
    }

    const charOffset = node === mirror ? (offset > 0 ? textLength : 0) : offset;

    return Math.max(0, Math.min(textLength, charOffset));
  }

  function setCursorPositionFromPoint(clientX: number, clientY: number) {
    const input = inputRef.current;
    const commandText = commandTextRef.current;
    const commandMeasurement = commandMeasurementRef.current;
    if (!input || !commandText || !commandMeasurement) {
      return;
    }

    const hitOffset = resolveCharOffsetFromPoint(
      clientX,
      clientY,
      commandMeasurement,
      command.length,
    );

    const nextCursorPosition =
      hitOffset ??
      approximateCharOffsetFromClientX(
        clientX,
        commandText,
        commandMeasurement,
        command.length,
      );

    input.focus({ preventScroll: true });
    input.setSelectionRange(nextCursorPosition, nextCursorPosition);
    setCursorPosition(nextCursorPosition);
    pauseCursorBlink();
  }

  useLayoutEffect(() => {
    setCursorPosition(inputRef.current?.selectionStart ?? 0);

    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }

    if (command === "") {
      resumeCursorBlinkImmediately();
    } else {
      pauseCursorBlink();
    }
  }, [command]);

  return {
    inputRef,
    commandTextRef,
    commandMeasurementRef,
    syncCursorPosition,
    setCursorPositionFromPoint,
    before: command.slice(0, cursorPosition),
    charUnderCursor: command[cursorPosition] ?? " ",
    after: command.slice(cursorPosition + 1),
    isCursorBlinking,
  };
}
