import { type HTMLAttributes, type ForwardedRef, forwardRef } from 'react'

interface TextInputProps extends HTMLAttributes<HTMLInputElement> {
  className?: string
  placeholder?: string
  value?: string
  autoComplete?: string
  disabled?: boolean
  maxLength?: number
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      className,
      placeholder,
      value,
      autoComplete,
      disabled,
      maxLength,
      ...props
    },
    ref: ForwardedRef<HTMLInputElement>,
  ) => (
    <input
      ref={ref}
      type="text"
      className={className}
      placeholder={placeholder}
      value={value}
      autoComplete={autoComplete}
      disabled={disabled}
      maxLength={maxLength}
      {...props}
    />
  ),
)

TextInput.displayName = 'TextInput'

export default TextInput
