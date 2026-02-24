import type { TerminalResponse } from "../../types/terminal-response";

const clearCommand = (): TerminalResponse => ({ type: "clear" });

export default clearCommand;
