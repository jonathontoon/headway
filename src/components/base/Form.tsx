import {
  type HTMLAttributes,
  type FunctionComponent,
  type PropsWithChildren,
} from "react"

interface FormProps extends HTMLAttributes<HTMLFormElement> {
  className?: string
}

const Form: FunctionComponent<PropsWithChildren<FormProps>> = ({
  className,
  children,
  ...attrs
}) => {
  return (
    <form className={className} {...attrs}>
      {children}
    </form>
  )
}

export default Form
