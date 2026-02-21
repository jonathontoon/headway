import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from 'react'

interface TableColumnGroupProps extends HTMLAttributes<HTMLTableColElement> {
  className?: string
}

const TableColumnGroup: FunctionComponent<
  PropsWithChildren<TableColumnGroupProps>
> = ({ className, children, ...attrs }) => (
  <colgroup className={className} {...attrs}>
    {children}
  </colgroup>
)

export default TableColumnGroup
