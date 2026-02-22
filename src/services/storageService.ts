export interface FileEntry {
  id: string;
  name: string;
}

const INDEX_KEY = "headway:files";
const ACTIVE_KEY = "headway:activeFile";
const LEGACY_KEY = "headway:content";

const contentKey = (id: string) => `headway:file:${id}`;

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function initStorage(defaultContent: string): { files: FileEntry[]; activeId: string } {
  const raw = localStorage.getItem(INDEX_KEY);
  if (raw) {
    const files = JSON.parse(raw) as FileEntry[];
    if (files.length > 0) {
      const stored = localStorage.getItem(ACTIVE_KEY);
      const activeId =
        stored && files.find((f) => f.id === stored) ? stored : files[0].id;
      return { files, activeId };
    }
  }

  // First run: migrate legacy single-file content if present
  const id = uid();
  const legacy = localStorage.getItem(LEGACY_KEY);
  const files: FileEntry[] = [{ id, name: "todo" }];
  localStorage.setItem(INDEX_KEY, JSON.stringify(files));
  localStorage.setItem(contentKey(id), legacy ?? defaultContent);
  localStorage.setItem(ACTIVE_KEY, id);
  if (legacy) localStorage.removeItem(LEGACY_KEY);
  return { files, activeId: id };
}

export function createFile(name: string, content = ""): FileEntry {
  const id = uid();
  const entry: FileEntry = { id, name };
  const files = listFiles();
  files.push(entry);
  localStorage.setItem(INDEX_KEY, JSON.stringify(files));
  localStorage.setItem(contentKey(id), content);
  return entry;
}

export function listFiles(): FileEntry[] {
  const raw = localStorage.getItem(INDEX_KEY);
  return raw ? (JSON.parse(raw) as FileEntry[]) : [];
}

export function readFile(id: string): string {
  return localStorage.getItem(contentKey(id)) ?? "";
}

export function saveFile(id: string, content: string): void {
  localStorage.setItem(contentKey(id), content);
}

export function renameFile(id: string, name: string): void {
  const files = listFiles().map((f) => (f.id === id ? { ...f, name } : f));
  localStorage.setItem(INDEX_KEY, JSON.stringify(files));
}

export function deleteFile(id: string): void {
  const files = listFiles().filter((f) => f.id !== id);
  localStorage.setItem(INDEX_KEY, JSON.stringify(files));
  localStorage.removeItem(contentKey(id));
}

export function setActiveFileId(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id);
}
