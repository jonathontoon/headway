import { useEventListener } from "./useEventListener";

/**
 * Adds a window or target `keydown` listener.
 *
 * @param listener - Handler called for each keydown event.
 * @param target - Event target. Defaults to `window` in the browser.
 * @returns Nothing.
 */
export const useKeyDown = (
  listener: (event: KeyboardEvent) => void,
  target: Window | null = typeof window === "undefined" ? null : window,
): void => {
  useEventListener(target, "keydown", listener);
};
