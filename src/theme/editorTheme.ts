import { createTheme } from "@uiw/codemirror-themes"
import { tags as t } from "@lezer/highlight"

export const editorTheme = createTheme({
  theme: "dark",
  settings: {
    background: "#000000",
    foreground: "#ffffff",
    caret: "#ffffff",
    selection: "#333333",
    selectionMatch: "#333333",
    lineHighlight: "#111111",
    gutterBackground: "#000000",
    gutterForeground: "#444444",
    fontFamily: "'Departure Mono', monospace",
  },
  styles: [
    { tag: t.comment, color: "#666666" },
    { tag: t.variableName, color: "#ffffff" },
    { tag: [t.string, t.special(t.brace)], color: "#cccccc" },
    { tag: t.number, color: "#aaaaaa" },
    { tag: t.bool, color: "#aaaaaa" },
    { tag: t.null, color: "#aaaaaa" },
    { tag: t.keyword, color: "#ffffff" },
    { tag: t.operator, color: "#ffffff" },
    { tag: t.className, color: "#ffffff" },
    { tag: t.definition(t.typeName), color: "#cccccc" },
    { tag: t.typeName, color: "#cccccc" },
    { tag: t.angleBracket, color: "#ffffff" },
    { tag: t.tagName, color: "#ffffff" },
    { tag: t.attributeName, color: "#cccccc" },
  ],
})
