import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from 'react';

interface UnorderedListProps extends HTMLAttributes<HTMLUListElement> {
  className?: string;
}

const UnorderedList: FunctionComponent<
  PropsWithChildren<UnorderedListProps>
> = ({ className, children, ...attrs }) => (
  <ul className={className} {...attrs}>
    {children}
  </ul>
);

export default UnorderedList;
