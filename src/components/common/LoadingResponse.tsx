import type { FunctionComponent } from "react"

import Div from "../base/Div.tsx"
import Span from "../base/Span.tsx"

interface LoadingResponseProps {
  className?: string
}

const LoadingResponse: FunctionComponent<LoadingResponseProps> = ({
  className,
}) => {
  return (
    <Div className={`flex items-center gap-2 ${className}`}>
      <Span className="before:content-['✦'] before:text-white before:animate-scan1"></Span>
      <Span className="before:content-['✦'] before:text-white before:animate-scan2"></Span>
      <Span className="before:content-['✦'] before:text-white before:animate-scan3"></Span>
    </Div>
  )
}

export default LoadingResponse
