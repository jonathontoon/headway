import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from 'react';

interface LinkProps extends HTMLAttributes<HTMLAnchorElement> {
  className?: string;
  href: string;
}

const Link: FunctionComponent<PropsWithChildren<LinkProps>> = ({
  className,
  href,
  children,
  ...attrs
}) => (
  <a
    rel="preload"
    className={`underline hover:no-underline ${className}`}
    href={href}
    {...attrs}
  >
    {children}
  </a>
);

export default Link;
