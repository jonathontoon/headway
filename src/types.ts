export enum ResponseType {
  Text = "text",
  Error = "error",
  Todo = "todo",
}

export type TextResponse = { type: ResponseType.Text; text: string };
export type ErrorResponse = { type: ResponseType.Error; text: string };
export type TodoResponse = {
  type: ResponseType.Todo;
  index: number;
  raw: string;
};

export type ResponseItem = TextResponse | ErrorResponse | TodoResponse;

export interface HistoryEntry {
  id: string;
  command: string;
  responses: ResponseItem[];
}
