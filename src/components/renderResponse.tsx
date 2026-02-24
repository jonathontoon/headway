import type { ReactNode } from 'react';
import type { HistoryItem } from '@reducers/terminalReducer';

import StatusResponse from '@components/StatusResponse';
import TodoListResponse from '@components/TodoListResponse';
import TagListResponse from '@components/TagListResponse';
import HelpResponse from '@components/HelpResponse';
import IntroResponse from '@components/IntroResponse';
import LogoResponse from '@components/LogoResponse';
import DefaultResponse from '@components/DefaultResponse';
import Prompt from '@components/Prompt';

type Renderer = (item: HistoryItem) => ReactNode;

const renderers: Partial<Record<HistoryItem['type'], Renderer>> = {
  status: (item) => {
    if (item.type !== 'status') return null;
    return (
      <StatusResponse
        key={item.id}
        statusType={item.statusType}
        statusText={item.statusText}
        hintText={item.hintText}
      />
    );
  },
  'todo-list': (item) => {
    if (item.type !== 'todo-list') return null;
    return <TodoListResponse key={item.id} todos={item.todos} title={item.title} />;
  },
  'tag-list': (item) => {
    if (item.type !== 'tag-list') return null;
    return <TagListResponse key={item.id} tags={item.tags} variant={item.variant} />;
  },
  help: (item) => <HelpResponse key={item.id} />,
  intro: (item) => <IntroResponse key={item.id} />,
  logo: (item) => <LogoResponse key={item.id} />,
  default: (item) => {
    if (item.type !== 'default') return null;
    return (
      <DefaultResponse
        key={item.id}
        responseText={`Command '${item.commandName}' not recognized.`}
        hintText={item.hintText ?? "Type 'help' for available commands."}
      />
    );
  },
  prompt: (item) => {
    if (item.type !== 'prompt') return null;
    return <Prompt key={item.id} value={item.value} disabled />;
  },
  clear: () => null,
};

const renderResponse = (item: HistoryItem): ReactNode =>
  renderers[item.type]?.(item) ?? null;

export default renderResponse;
