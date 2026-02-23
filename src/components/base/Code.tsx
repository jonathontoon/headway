import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from 'react';

interface CodeProps extends HTMLAttributes<HTMLSpanElement> {
  className?: string;
}

const Code: FunctionComponent<PropsWithChildren<CodeProps>> = ({
  className,
  children,
  ...attrs
}) => (
  <code className={className} {...attrs}>
    {children}
  </code>
);

export default Code;
