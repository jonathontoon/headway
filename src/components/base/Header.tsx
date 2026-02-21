import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from "react";

interface HeaderProps extends HTMLAttributes<HTMLElement> {
  className?: string;
}

const Header: FunctionComponent<PropsWithChildren<HeaderProps>> = ({
  className,
  children,
  ...attrs
}) => (
  <header className={className} {...attrs}>
    {children}
  </header>
);

export default Header;
