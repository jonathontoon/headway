export enum ResponseType {
  Text = "text",
  Error = "error",
  Todo = "todo",
  Help = "help",
}

export type TextResponse = { type: ResponseType.Text; text: string };
export type ErrorResponse = { type: ResponseType.Error; text: string };
export type TodoResponse = {
  type: ResponseType.Todo;
  index: number;
  text: string;
};
export type HelpCommand = { name: string; description: string };
export type HelpResponse = {
  type: ResponseType.Help;
  commands: HelpCommand[];
};

export type ResponseItem = TextResponse | ErrorResponse | TodoResponse | HelpResponse;

export interface HistoryEntry {
  id: string;
  command: string;
  responses: ResponseItem[];
}
