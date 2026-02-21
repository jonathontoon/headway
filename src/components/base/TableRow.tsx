import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from 'react'

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  className?: string
}

const TableRow: FunctionComponent<PropsWithChildren<TableRowProps>> = ({
  className,
  children,
  ...attrs
}) => (
  <tr className={className} {...attrs}>
    {children}
  </tr>
)

export default TableRow
