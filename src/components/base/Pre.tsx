import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from "react"

interface PreProps extends HTMLAttributes<HTMLPreElement> {
  className?: string
}

const Pre: FunctionComponent<PropsWithChildren<PreProps>> = ({
  className,
  children,
  ...attrs
}) => {
  return (
    <pre className={className} {...attrs}>
      {children}
    </pre>
  )
}

export default Pre
