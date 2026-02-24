import type { ReactNode } from 'react';
import type { TerminalResponse } from '@models/terminalResponse';

import StatusResponse from '@components/StatusResponse';
import TodoListResponse from '@components/TodoListResponse';
import TagListResponse from '@components/TagListResponse';
import HelpResponse from '@components/HelpResponse';
import IntroResponse from '@components/IntroResponse';
import LogoResponse from '@components/LogoResponse';
import DefaultResponse from '@components/DefaultResponse';
import Prompt from '@components/Prompt';

type Renderer = (item: TerminalResponse, key: number) => ReactNode;

const renderers: Partial<Record<TerminalResponse['type'], Renderer>> = {
  status: (item, key) => {
    if (item.type !== 'status') return null;
    return (
      <StatusResponse
        key={key}
        statusType={item.statusType}
        statusText={item.statusText}
        hintText={item.hintText}
      />
    );
  },
  'todo-list': (item, key) => {
    if (item.type !== 'todo-list') return null;
    return <TodoListResponse key={key} todos={item.todos} title={item.title} />;
  },
  'tag-list': (item, key) => {
    if (item.type !== 'tag-list') return null;
    return <TagListResponse key={key} tags={item.tags} variant={item.variant} />;
  },
  help: (_item, key) => <HelpResponse key={key} />,
  intro: (_item, key) => <IntroResponse key={key} />,
  logo: (_item, key) => <LogoResponse key={key} />,
  default: (item, key) => {
    if (item.type !== 'default') return null;
    return (
      <DefaultResponse
        key={key}
        responseText={`Command '${item.commandName}' not recognized.`}
        hintText={item.hintText ?? "Type 'help' for available commands."}
      />
    );
  },
  prompt: (item, key) => {
    if (item.type !== 'prompt') return null;
    return <Prompt key={key} value={item.value} disabled />;
  },
  clear: () => null,
};

const renderResponse = (item: TerminalResponse, key: number): ReactNode =>
  renderers[item.type]?.(item, key) ?? null;

export default renderResponse;
