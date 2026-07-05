import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import type { ReactNode } from "react";
import { ERROR_OUTPUT_PATTERN, SYNTAX_HIGHLIGHT_LANGUAGE } from "../constants";

type TokenStream = Array<string | Prism.Token>;

function renderTokens(tokens: TokenStream): ReactNode {
  return tokens.map((token, i) => {
    if (typeof token === "string") return token;

    const content = Array.isArray(token.content)
      ? renderTokens(token.content as TokenStream)
      : typeof token.content === "string"
        ? token.content
        : renderTokens([token.content as string | Prism.Token]);

    return (
      <span key={i} className={`token ${token.type}`}>
        {content}
      </span>
    );
  });
}

export function highlight(code: string): ReactNode {
  const tokens = Prism.tokenize(
    code,
    Prism.languages[SYNTAX_HIGHLIGHT_LANGUAGE],
  );
  return renderTokens(tokens);
}

export function highlightOutput(output: string): ReactNode {
  if (ERROR_OUTPUT_PATTERN.test(output)) {
    return <span className="token error-output">{output}</span>;
  }
  // Multi-line output is plain text (command results, lists, etc.) — don't tokenize
  if (output.includes("\n")) {
    return output;
  }
  return highlight(output);
}
