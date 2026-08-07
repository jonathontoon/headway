type TerminalGreetingProps = {
  readonly line: string;
};

export const TerminalGreeting = ({ line }: TerminalGreetingProps) => {
  const parts = line.split(/(\d+ overdue tasks?|\d+ due today)/);

  return (
    <div className="block whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (/^\d+ overdue tasks?$/.test(part)) {
          return (
            <span key={i} className="text-role-error">
              {part}
            </span>
          );
        }

        if (/^\d+ due today$/.test(part)) {
          return (
            <span key={i} className="text-role-warning">
              {part}
            </span>
          );
        }

        return part;
      })}
    </div>
  );
};
