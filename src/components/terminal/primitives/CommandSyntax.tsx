import type {
  CommandSyntaxProps,
  TerminalCommandSyntaxArgument,
} from "../../../types";

const getArgumentToken = (argument: TerminalCommandSyntaxArgument) => {
  switch (argument.kind) {
    case "choice":
      return `<${argument.options.join("|")}>`;
    case "value":
      return `<${argument.name}>`;
    default: {
      const exhaustiveCheck: never = argument;
      throw new Error(
        `Unhandled terminal command syntax argument: ${exhaustiveCheck}`
      );
    }
  }
};

const getArgumentClassName = (argument: TerminalCommandSyntaxArgument) => {
  switch (argument.kind) {
    case "choice":
      return "text-cyan-300";
    case "value":
      return "text-yellow-200";
    default: {
      const exhaustiveCheck: never = argument;
      throw new Error(
        `Unhandled terminal command syntax argument: ${exhaustiveCheck}`
      );
    }
  }
};

const CommandSyntax = ({
  syntax,
}: CommandSyntaxProps) => (
  <span className="wrap-break-word whitespace-pre-wrap">
    <span className="text-terminal-text">{syntax.command}</span>
    {syntax.arguments?.map((argument) => {
      const token = getArgumentToken(argument);

      return (
        <span key={`${syntax.command}:${token}`}>
          {" "}
          <span className={getArgumentClassName(argument)}>{token}</span>
        </span>
      );
    })}
  </span>
);

export default CommandSyntax;
