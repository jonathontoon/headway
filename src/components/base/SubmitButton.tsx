import Button, { type ButtonProps } from "@atoms/Button.tsx"

import type { FunctionComponent, PropsWithChildren } from "react"

const SubmitButton: FunctionComponent<PropsWithChildren<ButtonProps>> = ({
  children,
  ...attrs
}) => {
  return (
    <Button type="submit" {...attrs}>
      {children}
    </Button>
  )
}

export default SubmitButton
