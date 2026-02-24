import { useEffect } from "react";

/**
 * Hook that listens for viewport resize events.
 * The callback should be wrapped with useCallback to maintain stable dependency.
 */
const useViewportResize = (callback: (event: Event) => void) => {
  useEffect(() => {
    window.visualViewport?.addEventListener("resize", callback);
    return () => window.visualViewport?.removeEventListener("resize", callback);
  }, [callback]);
};

export default useViewportResize;
