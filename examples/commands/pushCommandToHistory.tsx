import { type ReactNode } from "react";
import Prompt from "@organisms/Prompt.tsx";

/**
 * Adds a command to the terminal history with the prompt prefix.
 * @param {string} command - The command to be added to history
 */
const pushCommandToHistory = (command: string, pushToHistory: (content: ReactNode) => void) => {
    pushToHistory(
        <Prompt value={command} disabled />
    );
};

export default pushCommandToHistory;