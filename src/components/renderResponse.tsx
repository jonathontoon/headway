import type { ReactNode } from "react";
import type { HistoryItem } from "../types/terminal";
import type {
  StatusHistoryItem,
  TodoHistoryItem,
  TagHistoryItem,
  DefaultHistoryItem,
  PromptHistoryItem,
  HelpHistoryItem,
  IntroHistoryItem,
  LogoHistoryItem,
} from "../types/helpers";

import {
  StatusResponse,
  TodoListResponse,
  TagListResponse,
  HelpResponse,
  IntroResponse,
  LogoResponse,
  DefaultResponse,
  Prompt,
} from ".";

const renderStatus = (item: StatusHistoryItem): ReactNode => {
  const { id, statusType, statusText, hintText } = item;
  return (
    <StatusResponse
      key={id}
      statusType={statusType}
      statusText={statusText}
      hintText={hintText}
    />
  );
};

const renderTodoList = (item: TodoHistoryItem): ReactNode => {
  const { id, todos, title } = item;
  return <TodoListResponse key={id} todos={todos} title={title} />;
};

const renderTagList = (item: TagHistoryItem): ReactNode => {
  const { id, tags, variant } = item;
  return <TagListResponse key={id} tags={tags} variant={variant} />;
};

const renderDefault = (item: DefaultHistoryItem): ReactNode => {
  const { id, commandName, hintText } = item;
  return (
    <DefaultResponse
      key={id}
      responseText={`Command '${commandName}' not recognized.`}
      hintText={hintText ?? "Type 'help' for available commands."}
    />
  );
};

const renderPrompt = (item: PromptHistoryItem): ReactNode => {
  const { id, value } = item;
  return <Prompt key={id} value={value} disabled />;
};

const renderHelp = (item: HelpHistoryItem): ReactNode => {
  const { id } = item;
  return <HelpResponse key={id} />;
};

const renderIntro = (item: IntroHistoryItem): ReactNode => {
  const { id } = item;
  return <IntroResponse key={id} />;
};

const renderLogo = (item: LogoHistoryItem): ReactNode => {
  const { id } = item;
  return <LogoResponse key={id} />;
};

const renderClear = (): ReactNode => null;

const renderers: Record<HistoryItem["type"], (item: HistoryItem) => ReactNode> =
  {
    status: renderStatus as (item: HistoryItem) => ReactNode,
    todo: renderTodoList as (item: HistoryItem) => ReactNode,
    tag: renderTagList as (item: HistoryItem) => ReactNode,
    help: renderHelp as (item: HistoryItem) => ReactNode,
    intro: renderIntro as (item: HistoryItem) => ReactNode,
    logo: renderLogo as (item: HistoryItem) => ReactNode,
    default: renderDefault as (item: HistoryItem) => ReactNode,
    prompt: renderPrompt as (item: HistoryItem) => ReactNode,
    clear: renderClear as (item: HistoryItem) => ReactNode,
  };

const renderResponse = (item: HistoryItem): ReactNode =>
  renderers[item.type](item);

export default renderResponse;
