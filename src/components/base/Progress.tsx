import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from "react";

interface ProgressProps extends HTMLAttributes<HTMLProgressElement> {
  className?: string;
  max?: number;
  value?: number;
}

const Progress: FunctionComponent<PropsWithChildren<ProgressProps>> = ({
  className,
  children,
  max,
  value,
  ...attrs
}) => (
  <progress className={className} max={max} value={value} {...attrs}>
    {children}
  </progress>
);

export default Progress;
