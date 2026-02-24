export interface TodoItem {
  raw: string;
  done: boolean;
  priority?: string;
  completionDate?: string;
  creationDate?: string;
  text: string;
  contexts: string[];
  projects: string[];
}
