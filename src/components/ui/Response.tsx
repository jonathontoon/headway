import type { ElementType, ReactNode } from "react";

interface Props {
  as?: ElementType;
  children: ReactNode;
  className: string;
}

const Response = ({ as: Component = "div", children, className }: Props) => (
  <Component className={className}>{children}</Component>
);

export default Response;
