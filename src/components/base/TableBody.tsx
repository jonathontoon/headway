import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from "react"

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  className?: string
}

const TableBody: FunctionComponent<PropsWithChildren<TableBodyProps>> = ({
  className,
  children,
  ...attrs
}) => {
  return (
    <tbody className={className} {...attrs}>
      {children}
    </tbody>
  )
}

export default TableBody
