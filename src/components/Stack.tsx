import { type FunctionComponent, type PropsWithChildren } from "react";

interface StackProps {
  gap?: 1 | 2;
  className?: string;
}

const GAP = { 1: "gap-1", 2: "gap-2" } as const;

const Stack: FunctionComponent<PropsWithChildren<StackProps>> = ({
  gap = 1,
  className = "",
  children,
}) => <div className={`flex flex-col ${GAP[gap]} ${className}`.trim()}>{children}</div>;

export default Stack;
