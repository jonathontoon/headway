import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from "react"

interface BodyProps extends HTMLAttributes<HTMLBodyElement> {
  className?: string
}

const Body: FunctionComponent<PropsWithChildren<BodyProps>> = ({
  className,
  children,
  ...attrs
}) => {
  return (
    <body className={className} {...attrs}>
      {children}
    </body>
  )
}

export default Body
