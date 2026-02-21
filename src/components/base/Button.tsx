import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from "react"

export interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  className?: string
  disabled?: boolean
  type?: string
}

const Button: FunctionComponent<PropsWithChildren<ButtonProps>> = ({
  className,
  children,
  ...attrs
}) => {
  return (
    <button className={className} {...attrs}>
      {children}
    </button>
  )
}

export default Button
