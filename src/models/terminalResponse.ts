import type { StatusType } from '@common/Status';
import type { TodoItem } from '@services/todoService';

export type TerminalResponse =
  | {
      type: 'status';
      statusType: StatusType;
      statusText: string;
      hintText?: string;
    }
  | { type: 'todo-list'; todos: TodoItem[]; title?: string }
  | { type: 'tag-list'; tags: string[]; variant: 'context' | 'project' }
  | { type: 'help' }
  | { type: 'intro' }
  | { type: 'logo' }
  | { type: 'default'; commandName: string; hintText?: string }
  | { type: 'clear' }
  | { type: 'prompt'; value: string };
