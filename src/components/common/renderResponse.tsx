import type { ReactNode } from 'react';
import type { TerminalResponse } from '@models/terminalResponse';

import StatusResponse from '@common/StatusResponse';
import TodoListResponse from '@common/TodoListResponse';
import HelpResponse from '@common/HelpResponse';
import IntroResponse from '@common/IntroResponse';
import LogoResponse from '@common/LogoResponse';
import DefaultResponse from '@common/DefaultResponse';
import Response from '@common/Response';
import Prompt from '@common/Prompt';

const renderResponse = (item: TerminalResponse, key: number): ReactNode => {
  switch (item.type) {
    case 'status':
      return (
        <StatusResponse
          key={key}
          statusType={item.statusType}
          statusText={item.statusText}
          hintText={item.hintText}
        />
      );
    case 'todo-list':
      return (
        <TodoListResponse key={key} todos={item.todos} title={item.title} />
      );
    case 'tag-list':
      return (
        <Response key={key}>
          {item.tags.map((tag, i) => (
            <p
              key={i}
              className={
                item.variant === 'context' ? 'text-cyan-400' : 'text-blue-400'
              }
            >
              {tag}
            </p>
          ))}
        </Response>
      );
    case 'help':
      return <HelpResponse key={key} />;
    case 'intro':
      return <IntroResponse key={key} />;
    case 'logo':
      return <LogoResponse key={key} />;
    case 'default':
      return (
        <DefaultResponse
          key={key}
          responseText={`Command '${item.commandName}' not recognized.`}
          hintText={item.hintText ?? "Type 'help' for available commands."}
        />
      );
    case 'prompt':
      return <Prompt key={key} value={item.value} disabled />;
    case 'clear':
      return null;
  }
};

export default renderResponse;
