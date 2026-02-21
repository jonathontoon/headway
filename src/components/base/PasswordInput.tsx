import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from "react"

interface PasswordInputProps extends HTMLAttributes<HTMLInputElement> {
  className?: string
}

const PasswordInput: FunctionComponent<
  PropsWithChildren<PasswordInputProps>
> = ({ className, children, ...attrs }) => {
  return (
    <input type="password" className={className} {...attrs}>
      {children}
    </input>
  )
}

export default PasswordInput
