import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from 'react';

interface SpanProps extends HTMLAttributes<HTMLSpanElement> {
  className?: string;
}

const Span: FunctionComponent<PropsWithChildren<SpanProps>> = ({
  className,
  children,
  ...attrs
}) => (
  <span className={className} {...attrs}>
    {children}
  </span>
);

export default Span;
