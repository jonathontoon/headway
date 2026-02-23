/**
 * Handles the 'clear' command by resetting the terminal history.
 */
const handleClearCommand = async (resetTerminal: () => void) => {
  resetTerminal();
};

export default handleClearCommand;
