import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from "react"

interface ListItemProps extends HTMLAttributes<HTMLLIElement> {
  className?: string
}

const ListItem: FunctionComponent<PropsWithChildren<ListItemProps>> = ({
  className,
  children,
  ...attrs
}) => {
  return (
    <li className={className} {...attrs}>
      {children}
    </li>
  )
}

export default ListItem
