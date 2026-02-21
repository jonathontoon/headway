import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from "react"

interface SmallProps extends HTMLAttributes<HTMLElement> {
  className?: string
}

const Small: FunctionComponent<PropsWithChildren<SmallProps>> = ({
  className,
  children,
  ...attrs
}) => {
  return (
    <small className={className} {...attrs}>
      {children}
    </small>
  )
}

export default Small
