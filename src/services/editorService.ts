import { EditorView } from "@codemirror/view"
import type { Extension } from "@codemirror/state"

export const baseExtensions: Extension[] = [
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
]
