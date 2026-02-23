import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from 'react';

interface TableHeadingProps extends HTMLAttributes<HTMLTableCellElement> {
  className?: string;
}

const TableHeading: FunctionComponent<PropsWithChildren<TableHeadingProps>> = ({
  className,
  children,
  ...attrs
}) => (
  <th className={className} {...attrs}>
    {children}
  </th>
);

export default TableHeading;
