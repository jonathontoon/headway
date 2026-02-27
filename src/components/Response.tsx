import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className: string;
}

const Response = ({ children, className }: Props) => (
  <div className={className}>{children}</div>
);

export default Response;
