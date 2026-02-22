import type { EditorView } from "@codemirror/view";

interface ActionBarProps {
  editorView: EditorView | null;
}

const today = () => new Date().toISOString().slice(0, 10);

const INSERTS: { label: string; text: string | (() => string) }[] = [
  { label: "(A)", text: "(A) " },
  { label: "(B)", text: "(B) " },
  { label: "(C)", text: "(C) " },
  { label: "@", text: "@" },
  { label: "+", text: "+" },
  { label: "due:", text: () => `due:${today()} ` },
];

const ActionBar = ({ editorView }: ActionBarProps) => {
  const insert = (text: string | (() => string)) => {
    if (!editorView) return;
    const str = typeof text === "function" ? text() : text;
    editorView.dispatch(editorView.state.replaceSelection(str));
    editorView.focus();
  };

  const toggleDone = () => {
    if (!editorView) return;
    const { state } = editorView;
    const line = state.doc.lineAt(state.selection.main.head);
    const text = line.text;
    if (text.startsWith("x ")) {
      // strip completion mark and optional completion date
      const rest = text.slice(2).replace(/^\d{4}-\d{2}-\d{2} /, "");
      editorView.dispatch({
        changes: { from: line.from, to: line.to, insert: rest },
        selection: { anchor: line.from },
      });
    } else {
      const prefix = `x ${today()} `;
      editorView.dispatch({
        changes: { from: line.from, to: line.from, insert: prefix },
        selection: { anchor: line.from + prefix.length },
      });
    }
    editorView.focus();
  };

  const btn =
    "px-2.5 py-1 text-xs rounded border border-[#2a2a2a] text-[#666666] active:text-white active:border-[#555555] cursor-pointer whitespace-nowrap";

  return (
    <div className="flex flex-row items-center gap-1.5 px-3 py-2 bg-black border-t border-[#1a1a1a] shrink-0 overflow-x-auto">
      {INSERTS.map(({ label, text }) => (
        <button
          key={label}
          className={btn}
          onPointerDown={(e) => {
            e.preventDefault();
            insert(text);
          }}
        >
          {label}
        </button>
      ))}
      <div className="w-px h-4 bg-[#2a2a2a] mx-0.5 shrink-0" />
      <button
        className={btn}
        onPointerDown={(e) => {
          e.preventDefault();
          toggleDone();
        }}
      >
        done
      </button>
    </div>
  );
};

export default ActionBar;
