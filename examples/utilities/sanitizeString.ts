const sanitizeString = (command: string) => {
  return command.trim().toLowerCase();
};

export default sanitizeString;
