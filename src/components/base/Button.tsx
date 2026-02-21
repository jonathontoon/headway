import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from 'react'

export interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  className?: string
  disabled?: boolean
  type?: 'submit' | 'reset' | 'button'
}

const Button: FunctionComponent<PropsWithChildren<ButtonProps>> = ({
  className,
  children,
  ...attrs
}) => (
  <button className={className} {...attrs}>
    {children}
  </button>
)

export default Button
