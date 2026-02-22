import { useState, useCallback, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import type { EditorView } from "@codemirror/view";
import { editorTheme } from "@theme/editorTheme";
import { baseExtensions } from "@services/editorService";
import {
  initStorage,
  createFile,
  readFile,
  saveFile,
  renameFile,
  deleteFile,
  setActiveFileId,
  type FileEntry,
} from "@services/storageService";
import Tabs from "@common/Tabs";
import ActionBar from "@common/ActionBar";
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

const defaultContent = `(A) Review project proposal +webapp @work due:2026-02-22
(B) Fix login bug +webapp @work due:2026-02-20
(C) Buy groceries +groceries @home due:2026-02-22
2026-02-21 Update documentation +webapp @work
Call dentist @phone due:2026-02-28
Organise notes @home +personal
x 2026-02-20 2026-02-19 Set up repository +webapp @work
`;

// initStorage is idempotent after first call — safe to call twice for two useState initialisers
const Editor = () => {
  const [files, setFiles] = useState<FileEntry[]>(() => initStorage(defaultContent).files);
  const [activeId, setActiveId] = useState<string>(() => initStorage(defaultContent).activeId);
  const [stats, setStats] = useState(() => parseTodoStats(readFile(activeId)));

  const editorViewRef = useRef<EditorView | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushSave = useCallback(
    (id: string) => {
      if (saveTimer.current && editorViewRef.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
        saveFile(id, editorViewRef.current.state.doc.toString());
      }
    },
    [],
  );

  const switchFile = useCallback(
    (id: string) => {
      flushSave(activeId);
      setActiveFileId(id);
      setActiveId(id);
      setStats(parseTodoStats(readFile(id)));
    },
    [activeId, flushSave],
  );

  const handleCreate = useCallback(() => {
    flushSave(activeId);
    const entry = createFile(`todo-${files.length + 1}`);
    setFiles((f) => [...f, entry]);
    setActiveFileId(entry.id);
    setActiveId(entry.id);
    setStats(parseTodoStats(""));
  }, [activeId, files.length, flushSave]);

  const handleRename = useCallback((id: string, name: string) => {
    renameFile(id, name);
    setFiles((f) => f.map((file) => (file.id === id ? { ...file, name } : file)));
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      deleteFile(id);
      const remaining = files.filter((f) => f.id !== id);
      setFiles(remaining);
      if (activeId === id) {
        const next = remaining[0];
        setActiveFileId(next.id);
        setActiveId(next.id);
        setStats(parseTodoStats(readFile(next.id)));
      }
    },
    [files, activeId],
  );

  const handleChange = useCallback(
    (value: string) => {
      setStats(parseTodoStats(value));
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveFile(activeId, value), 500);
    },
    [activeId],
  );

  return (
    <div className="flex flex-col w-screen h-dvh bg-black overflow-hidden">
      <Tabs
        files={files}
        activeId={activeId}
        onSwitch={switchFile}
        onCreate={handleCreate}
        onRename={handleRename}
        onDelete={handleDelete}
      />
      <CodeMirror
        key={activeId}
        value={readFile(activeId)}
        theme={editorTheme}
        extensions={baseExtensions}
        onChange={handleChange}
        onCreateEditor={(view) => {
          editorViewRef.current = view;
        }}
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
          completionKeymap: true,
          lintKeymap: false,
        }}
        className="flex-1 overflow-hidden"
      />
      <ActionBar editorView={editorViewRef.current} />
      <Summary {...stats} />
    </div>
  );
};

export default Editor;
