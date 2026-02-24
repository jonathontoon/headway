import { type FunctionComponent, type PropsWithChildren } from "react";

interface StackProps {
  gap?: 1 | 2;
  className?: string;
}

const Stack: FunctionComponent<PropsWithChildren<StackProps>> = ({
  gap = 1,
  className = "",
  children,
}) => <div className={`flex flex-col gap-${gap} ${className}`.trim()}>{children}</div>;

export default Stack;
