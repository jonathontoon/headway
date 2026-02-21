import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from 'react'

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  className?: string
}

const Table: FunctionComponent<PropsWithChildren<TableProps>> = ({
  className,
  children,
  ...attrs
}) => (
  <table className={className} {...attrs}>
    {children}
  </table>
)

export default Table
