import type {
  TerminalCommandSignatureArgument,
  TerminalCommandSignatureProps,
} from "../../../types";

const getArgumentToken = (argument: TerminalCommandSignatureArgument) => {
  switch (argument.kind) {
    case "choice":
      return `<${argument.options.join("|")}>`;
    case "value":
      return `<${argument.name}>`;
    default: {
      const exhaustiveCheck: never = argument;
      throw new Error(
        `Unhandled terminal command signature argument: ${exhaustiveCheck}`
      );
    }
  }
};

const getArgumentClassName = (argument: TerminalCommandSignatureArgument) => {
  switch (argument.kind) {
    case "choice":
      return "text-cyan-300";
    case "value":
      return "text-yellow-200";
    default: {
      const exhaustiveCheck: never = argument;
      throw new Error(
        `Unhandled terminal command signature argument: ${exhaustiveCheck}`
      );
    }
  }
};

const TerminalCommandSignature = ({
  signature,
}: TerminalCommandSignatureProps) => (
  <span className="wrap-break-word whitespace-pre-wrap">
    <span className="text-terminal-text">{signature.command}</span>
    {signature.arguments?.map((argument) => {
      const token = getArgumentToken(argument);

      return (
        <span key={`${signature.command}:${token}`}>
          {" "}
          <span className={getArgumentClassName(argument)}>{token}</span>
        </span>
      );
    })}
  </span>
);

export default TerminalCommandSignature;
