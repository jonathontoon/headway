import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import {
  autocompletion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import { todotxt } from "@plugins/lang-todotxt";

function todotxtCompletions(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/[@+]\S*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  const prefix = word.text[0];
  const doc = context.state.doc.toString();
  const pattern = prefix === "@" ? /@\S+/g : /\+\S+/g;
  const seen = new Set<string>();
  for (const match of doc.matchAll(pattern)) {
    if (match[0] !== word.text) seen.add(match[0]);
  }
  if (seen.size === 0) return null;

  return {
    from: word.from,
    options: Array.from(seen).map((label) => ({ label })),
  };
}

export const baseExtensions: Extension[] = [
  todotxt(),
  EditorView.lineWrapping,
  autocompletion({ override: [todotxtCompletions], activateOnTyping: true }),
  EditorView.theme({
    "&": {
      width: "100%",
      height: "100%",
      fontSize: "14px",
    },
    ".cm-scroller": {
      overflow: "auto",
      fontFamily: "'Departure Mono', monospace",
    },
    ".cm-content": {
      padding: "16px 0",
      caretColor: "#ffffff",
    },
    ".cm-line": {
      padding: "0 16px",
    },
    ".cm-cursor": {
      borderLeftColor: "#ffffff",
    },
    ".cm-tooltip.cm-tooltip-autocomplete": {
      background: "#111111",
      border: "1px solid #333333",
      fontFamily: "'Departure Mono', monospace",
      fontSize: "14px",
    },
    ".cm-tooltip-autocomplete > ul > li": {
      color: "#aaaaaa",
      padding: "2px 8px",
    },
    ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
      background: "#222222",
      color: "#ffffff",
    },
  }),
];
