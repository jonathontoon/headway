import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from 'react';

interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  className?: string;
}

const TableCell: FunctionComponent<PropsWithChildren<TableCellProps>> = ({
  className,
  children,
  ...attrs
}) => (
  <td className={className} {...attrs}>
    {children}
  </td>
);

export default TableCell;
