import { useEffect, type DependencyList, type RefObject } from "react";

export const useScrollToBottom = (
  ref: RefObject<HTMLElement | null>,
  deps: DependencyList
): void => {
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [deps, ref]);
};
