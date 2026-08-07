import { Fragment } from "react";

type TerminalPromptSymbolProps = {
  readonly prompt: string;
};

export const TerminalPromptSymbol = ({ prompt }: TerminalPromptSymbolProps) => {
  const [head, ...rest] = prompt;

  return (
    <Fragment>
      <span className="text-role-accent">{head}</span>
      <span className="text-role-command">{rest.join("")}</span>
    </Fragment>
  );
};
