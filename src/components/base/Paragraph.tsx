import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from "react";

interface ParagraphProps extends HTMLAttributes<HTMLParagraphElement> {
  className?: string;
}

const Paragraph: FunctionComponent<PropsWithChildren<ParagraphProps>> = ({
  className,
  children,
  ...attrs
}) => (
  <p className={className} {...attrs}>
    {children}
  </p>
);

export default Paragraph;
