import Button, { type ButtonProps } from '@base/Button.tsx'

import type { FunctionComponent, PropsWithChildren } from 'react'

const SubmitButton: FunctionComponent<PropsWithChildren<ButtonProps>> = ({
  children,
  ...attrs
}) => (
  <Button type="submit" {...attrs}>
    {children}
  </Button>
)

export default SubmitButton
