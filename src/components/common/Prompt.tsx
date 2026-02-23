import { type KeyboardEvent, type ChangeEvent, forwardRef } from 'react';

import Span from '@base/Span';
import TextInput from '@base/TextInput';

import Response from '@common/Response';

interface PromptProps {
  value?: string;
  disabled?: boolean;
  placeholder?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
}

const Prompt = forwardRef<HTMLInputElement, PromptProps>(
  ({ value = '', disabled = false, placeholder, onChange, onKeyDown }, ref) => (
    <Response className="flex items-center">
      <Span className="text-sky-400">~</Span>
      <Span className="text-zinc-50">$</Span>
      <TextInput
        className="ml-2 w-full border-none bg-transparent text-zinc-50 placeholder-zinc-600 outline-none"
        ref={ref}
        value={value}
        disabled={disabled}
        onChange={onChange}
        onKeyDown={onKeyDown}
        autoComplete="off"
        autoCapitalize="none"
        placeholder={placeholder}
        data-1p-ignore="true"
        data-lpignore="true"
        data-protonpass-ignore="true"
        data-bwignore="true"
      />
    </Response>
  )
);

Prompt.displayName = 'Prompt';

export default Prompt;
