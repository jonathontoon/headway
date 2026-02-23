import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from 'react';

interface TableColumnProps extends HTMLAttributes<HTMLTableColElement> {
  className?: string;
}

const TableColumn: FunctionComponent<PropsWithChildren<TableColumnProps>> = ({
  className,
  children,
  ...attrs
}) => (
  <col className={className} {...attrs}>
    {children}
  </col>
);

export default TableColumn;
