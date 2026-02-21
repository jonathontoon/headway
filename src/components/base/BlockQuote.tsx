import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from "react"

interface BlockQuoteProps extends HTMLAttributes<HTMLQuoteElement> {
  className?: string
}

const BLockQuote: FunctionComponent<PropsWithChildren<BlockQuoteProps>> = ({
  className,
  children,
  ...attrs
}) => {
  return (
    <blockquote className={className} {...attrs}>
      {children}
    </blockquote>
  )
}

export default BLockQuote
