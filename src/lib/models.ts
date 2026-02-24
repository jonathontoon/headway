export interface TodoItem {
  id: string;
  raw: string;
  done: boolean;
  archived?: boolean;
  priority?: string;
  completionDate?: string;
  creationDate?: string;
  text: string;
  contexts: string[];
  projects: string[];
}
