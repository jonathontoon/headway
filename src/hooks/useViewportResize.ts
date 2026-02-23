import { useEffect } from 'react';

const useViewportResize = (callback: (event: Event) => void) => {
  useEffect(() => {
    window.visualViewport?.addEventListener('resize', callback);
    return () => window.visualViewport?.removeEventListener('resize', callback);
  }, [callback]);
};

export default useViewportResize;
