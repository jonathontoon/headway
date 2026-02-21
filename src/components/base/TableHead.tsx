import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from 'react'

interface TableHeadProps extends HTMLAttributes<HTMLTableSectionElement> {
  className?: string
}

const TableHead: FunctionComponent<PropsWithChildren<TableHeadProps>> = ({
  className,
  children,
  ...attrs
}) => (
  <thead className={className} {...attrs}>
    {children}
  </thead>
)

export default TableHead
