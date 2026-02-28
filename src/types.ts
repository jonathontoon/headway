export enum ResponseType {
  Text = "text",
  Error = "error",
  Success = "success",
  Warning = "warning",
  Todo = "todo",
  BucketedTodo = "bucketed_todo",
  Help = "help",
}

export type TextResponse = { type: ResponseType.Text; text: string };
export type ErrorResponse = { type: ResponseType.Error; text: string };
export type SuccessResponse = { type: ResponseType.Success; text: string };
export type WarningResponse = { type: ResponseType.Warning; text: string };
export type Todo = {
  index: number;
  text: string;
};

export type TodoResponse = {
  type: ResponseType.Todo;
  items: Todo[];
};
export type BucketedSection = { label: string; items: Todo[] };

export type BucketedTodoResponse = {
  type: ResponseType.BucketedTodo;
  sections: BucketedSection[];
};

export type HelpCommand = { name: string; description: string };
export type HelpSection = { title: string; commands: HelpCommand[] };
export type HelpResponse = {
  type: ResponseType.Help;
  sections: HelpSection[];
};

export type ResponseItem =
  | TextResponse
  | ErrorResponse
  | SuccessResponse
  | WarningResponse
  | TodoResponse
  | BucketedTodoResponse
  | HelpResponse;

export interface HistoryEntry {
  id: string;
  command: string;
  responses: ResponseItem[];
}
