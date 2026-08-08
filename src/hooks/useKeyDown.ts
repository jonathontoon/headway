import { useEventListener } from "./useEventListener";

export const useKeyDown = (
  listener: (event: KeyboardEvent) => void,
  target: Window | null = typeof window === "undefined" ? null : window,
): void => {
  useEventListener(target, "keydown", listener);
};
