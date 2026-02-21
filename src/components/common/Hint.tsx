import type { FunctionComponent, PropsWithChildren } from "react"
import Paragraph from "../base/Paragraph.tsx"

interface HintProps {
  className?: string
}

const Hint: FunctionComponent<PropsWithChildren<HintProps>> = ({
  className,
  children,
}) => {
  return (
    <Paragraph className={`text-zinc-500 ${className}`}>{children}</Paragraph>
  )
}

export default Hint
