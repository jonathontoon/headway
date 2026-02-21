import { useState, useCallback } from "react"
import CodeMirror from "@uiw/react-codemirror"
import { editorTheme } from "@theme/editorTheme"
import { baseExtensions } from "@services/editorService"
import Summary from "@common/Summary"

function computeStats(content: string) {
  const trimmed = content.trim()
  const wordCount = trimmed === "" ? 0 : trimmed.split(/\s+/).length
  const charCount = content.length
  const readingTime = Math.ceil(wordCount / 200)
  return { wordCount, charCount, readingTime }
}

function Editor() {
  const [stats, setStats] = useState({ wordCount: 0, charCount: 0, readingTime: 0 })

  const handleChange = useCallback((value: string) => {
    setStats(computeStats(value))
  }, [])

  return (
    <div className="flex flex-col w-screen h-dvh bg-black overflow-hidden">
      <CodeMirror
        value=""
        theme={editorTheme}
        extensions={baseExtensions}
        onChange={handleChange}
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
        className="flex-1 overflow-hidden"
      />
      <Summary {...stats} />
    </div>
  )
}

export default Editor
