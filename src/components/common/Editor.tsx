import CodeMirror from "@uiw/react-codemirror"
import { editorTheme } from "../../theme/editorTheme"
import { baseExtensions } from "../../services/editorService"

function Editor() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#000000",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CodeMirror
        value=""
        theme={editorTheme}
        extensions={baseExtensions}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: false,
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
          highlightSpecialChars: false,
          history: true,
          drawSelection: true,
          syntaxHighlighting: false,
          bracketMatching: false,
          closeBrackets: false,
          autocompletion: false,
          rectangularSelection: false,
          crosshairCursor: false,
          highlightSelectionMatches: false,
          closeBracketsKeymap: false,
          searchKeymap: false,
          foldKeymap: false,
          completionKeymap: false,
          lintKeymap: false,
        }}
        style={{
          flex: 1,
          height: "100%",
        }}
      />
    </div>
  )
}

export default Editor
