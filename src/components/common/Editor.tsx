import { useState, useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { editorTheme } from "@theme/editorTheme";
import { baseExtensions } from "@services/editorService";
import Summary from "@common/Summary";

const parseTodoStats = (content: string) => {
  const today = new Date().toISOString().slice(0, 10);
  const lines = content.split("\n").filter((line) => line.trim() !== "");

  let totalTasks = 0;
  let overdue = 0;
  let dueToday = 0;
  const contexts = new Set<string>();
  const projects = new Set<string>();

  for (const line of lines) {
    if (/^x /.test(line)) continue;

    totalTasks++;

    for (const word of line.split(/\s+/)) {
      if (word.startsWith("@") && word.length > 1) contexts.add(word);
      if (word.startsWith("+") && word.length > 1) projects.add(word);
    }

    const dueMatch = line.match(/\bdue:(\d{4}-\d{2}-\d{2})\b/);
    if (dueMatch) {
      const dueDate = dueMatch[1];
      if (dueDate < today) overdue++;
      else if (dueDate === today) dueToday++;
    }
  }

  return { totalTasks, overdue, dueToday, contexts: contexts.size, projects: projects.size };
};

const Editor = () => {
  const [stats, setStats] = useState({ totalTasks: 0, overdue: 0, dueToday: 0, contexts: 0, projects: 0 });

  const handleChange = useCallback((value: string) => {
    setStats(parseTodoStats(value));
  }, []);

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
  );
};

export default Editor;
