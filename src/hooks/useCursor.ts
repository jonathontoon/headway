import { useEffect, useLayoutEffect, useRef, useState } from "react";

const CURSOR_BLINK_RESUME_DELAY_MS = 500;

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

  function setCursorPositionFromClientX(clientX: number) {
    const input = inputRef.current;
    const commandText = commandTextRef.current;
    const commandMeasurement = commandMeasurementRef.current;
    if (!input || !commandText || !commandMeasurement) {
      return;
    }

    const textRect = commandText.getBoundingClientRect();
    const measurementRect = commandMeasurement.getBoundingClientRect();
    const measuredLength = Math.max(command.length, 1);
    const charWidth = measurementRect.width / measuredLength;
    const nextCursorPosition =
      charWidth > 0
        ? Math.max(
            0,
            Math.min(
              command.length,
              Math.round((clientX - textRect.left) / charWidth),
            ),
          )
        : command.length;

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
    setCursorPositionFromClientX,
    before: command.slice(0, cursorPosition),
    charUnderCursor: command[cursorPosition] ?? " ",
    after: command.slice(cursorPosition + 1),
    isCursorBlinking,
  };
}
