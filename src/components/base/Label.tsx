import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from "react";

interface LabelProps extends HTMLAttributes<HTMLLabelElement> {
  className?: string;
}

const Label: FunctionComponent<PropsWithChildren<LabelProps>> = ({
  className,
  children,
  ...attrs
}) => (
  <label className={className} {...attrs}>
    {children}
  </label>
);

export default Label;
