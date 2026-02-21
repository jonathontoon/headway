import { forwardRef, type HTMLAttributes, type ForwardedRef } from 'react'

interface MainProps extends HTMLAttributes<HTMLDivElement> {
  className?: string
}

const Main = forwardRef<HTMLDivElement, MainProps>(
  ({ className, children, ...attrs }, ref: ForwardedRef<HTMLDivElement>) => (
    <main className={className} {...attrs} ref={ref}>
      {children}
    </main>
  ),
)

Main.displayName = 'Main'

export default Main
