import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from "react"

interface OrderedListProps extends HTMLAttributes<HTMLOListElement> {
  className?: string
}

const OrderedList: FunctionComponent<PropsWithChildren<OrderedListProps>> = ({
  className,
  children,
  ...attrs
}) => {
  return (
    <ol className={className} {...attrs}>
      {children}
    </ol>
  )
}

export default OrderedList
