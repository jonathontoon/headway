import { useEffect, useRef, type ChangeEvent, type KeyboardEvent } from "react";
import { TERMINAL_DEPLOY_DELAY_MS } from "../../constants";
import {
  clearInput,
  navigateHistory,
  resolvePendingCommand,
  setInput,
  submitInput,
} from "../../actions/terminalActions";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { createPendingCommandCompletionItems } from "../../lib/terminal/commands";
import { selectTerminalInput } from "../../selectors/selectTerminalInput";
import { selectTerminalItems } from "../../selectors/selectTerminalItems";
import { selectTerminalPendingCommand } from "../../selectors/selectTerminalPendingCommand";
import History from "./History";
import Prompt from "./Prompt";

const Terminal = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();
  const input = useAppSelector(selectTerminalInput);
  const items = useAppSelector(selectTerminalItems);
  const pendingCommand = useAppSelector(selectTerminalPendingCommand);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

    inputRef.current?.focus();
  }, [items]);

  useEffect(() => {
    if (!pendingCommand) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch(
        resolvePendingCommand(
          createPendingCommandCompletionItems(pendingCommand)
        )
      );
    }, TERMINAL_DEPLOY_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dispatch, pendingCommand]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch(setInput(event.target.value));
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "Enter":
        dispatch(submitInput());
        break;
      case "ArrowUp":
        event.preventDefault();
        dispatch(navigateHistory("up"));
        break;
      case "ArrowDown":
        event.preventDefault();
        dispatch(navigateHistory("down"));
        break;
      case "Escape":
        event.preventDefault();
        dispatch(clearInput());
        break;
      default:
        break;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-4
          [&::-webkit-scrollbar]:w-1
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-zinc-600
          [&::-webkit-scrollbar-thumb:hover]:bg-zinc-500"
      >
        <History items={items} />
        <Prompt
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
        />
      </div>
    </div>
  );
};

export default Terminal;
