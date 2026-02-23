import { forwardRef, type PropsWithChildren, useCallback, useState } from "react";
import Section from "@base/Section";
import useViewportResize from "@hooks/useViewportResize";

interface ScrollViewProps {
  className?: string;
}

const ScrollView = forwardRef<HTMLDivElement, PropsWithChildren<ScrollViewProps>>(
  ({ className, children }, ref) => {
    const [height, setHeight] = useState(window.visualViewport?.height || window.innerHeight);

    const handleResize = useCallback(() => {
      setHeight(window.visualViewport?.height || window.innerHeight);
    }, []);

    useViewportResize(handleResize);

    return (
      <Section
        ref={ref}
        className={`p-4 overflow-y-auto ${className || ""}`}
        style={{ maxHeight: `${height}px` }}
      >
        {children}
      </Section>
    );
  }
);

ScrollView.displayName = "ScrollView";

export default ScrollView;
