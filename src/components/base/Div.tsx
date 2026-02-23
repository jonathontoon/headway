import { type HTMLAttributes, type ForwardedRef, forwardRef } from 'react';

interface Props extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Div = forwardRef(
  (
    { className, children, ...attrs }: Props,
    ref: ForwardedRef<HTMLDivElement>
  ) => (
    <div className={className} ref={ref} {...attrs}>
      {children}
    </div>
  )
);

Div.displayName = 'Div';

export default Div;
