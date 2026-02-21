import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from "react";

interface FooterProps extends HTMLAttributes<HTMLElement> {
  className?: string;
}

const Footer: FunctionComponent<PropsWithChildren<FooterProps>> = ({
  className,
  children,
  ...attrs
}) => (
  <footer className={className} {...attrs}>
    {children}
  </footer>
);

export default Footer;
