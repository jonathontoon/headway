import { forwardRef, useCallback, type PropsWithChildren, useState } from 'react';
import useViewportResize from '@hooks/useViewportResize';

interface ScrollViewProps {
  className?: string;
}

const ScrollView = forwardRef<HTMLElement, PropsWithChildren<ScrollViewProps>>(
  ({ className, children }, ref) => {
    const [height, setHeight] = useState(
      window.visualViewport?.height || window.innerHeight
    );

    const handleResize = useCallback(() => {
      const newHeight = window.visualViewport?.height || window.innerHeight;
      setHeight((h) => (h === newHeight ? h : newHeight));
    }, []);

    useViewportResize(handleResize);

    return (
      <section
        ref={ref}
        className={`p-4 overflow-y-auto ${className || ''}`}
        style={{ maxHeight: `${height}px` }}
      >
        {children}
      </section>
    );
  }
);

ScrollView.displayName = 'ScrollView';

export default ScrollView;
