import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from "react";

interface FieldSetProps extends HTMLAttributes<HTMLFieldSetElement> {
  className?: string;
}

const FieldSet: FunctionComponent<PropsWithChildren<FieldSetProps>> = ({
  className,
  children,
  ...attrs
}) => (
  <fieldset className={className} {...attrs}>
    {children}
  </fieldset>
);

export default FieldSet;
