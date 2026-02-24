import type { TerminalResponse } from "../../types/terminal-response";

const helpCommand = (): TerminalResponse => ({ type: "help" });

export default helpCommand;
