import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { todotxt } from "@plugins/lang-todotxt";

export const baseExtensions: Extension[] = [
  todotxt(),
  EditorView.lineWrapping,
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
  }),
];
