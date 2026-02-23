/**
 * Handles the 'clear' command by resetting the terminal history.
 */
const clearCommand = async (resetTerminal: () => void) => {
  resetTerminal();
};

export default clearCommand;
