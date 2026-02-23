import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from 'react';

interface LegendProps extends HTMLAttributes<HTMLLegendElement> {
  className?: string;
}

const Legend: FunctionComponent<PropsWithChildren<LegendProps>> = ({
  className,
  children,
  ...attrs
}) => (
  <legend className={className} {...attrs}>
    {children}
  </legend>
);

export default Legend;
