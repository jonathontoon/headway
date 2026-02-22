import { useState, useRef, useEffect } from "react";
import type { FileEntry } from "@services/storageService";

interface TabsProps {
  files: FileEntry[];
  activeId: string;
  onSwitch: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

const Tabs = ({ files, activeId, onSwitch, onCreate, onRename, onDelete }: TabsProps) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId) inputRef.current?.focus();
  }, [renamingId]);

  const startRename = (id: string, name: string) => {
    setRenamingId(id);
    setRenameValue(name);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) onRename(renamingId, renameValue.trim());
    setRenamingId(null);
  };

  return (
    <header className="flex flex-row items-stretch h-9 bg-black border-b border-[#1a1a1a] shrink-0 select-none overflow-x-auto">
      {files.map((file) => {
        const isActive = file.id === activeId;
        const isRenaming = renamingId === file.id;
        return (
          <div
            key={file.id}
            onClick={() => !isActive && onSwitch(file.id)}
            onDoubleClick={() => startRename(file.id, file.name)}
            className={[
              "flex items-center gap-1.5 px-3 text-xs whitespace-nowrap border-r border-[#1a1a1a] cursor-pointer",
              isActive
                ? "text-white border-b-2 border-b-white -mb-px"
                : "text-[#555555]",
            ].join(" ")}
          >
            {isRenaming ? (
              <input
                ref={inputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setRenamingId(null);
                }}
                className="bg-transparent outline-none w-20 text-white"
              />
            ) : (
              <>
                <span>{file.name}</span>
                {files.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(file.id);
                    }}
                    className="text-[#333333] hover:text-[#777777] leading-none"
                  >
                    ×
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}
      <button
        onClick={onCreate}
        className="flex items-center px-3 text-[#444444] hover:text-white text-sm leading-none cursor-pointer"
      >
        +
      </button>
    </header>
  );
};

export default Tabs;
