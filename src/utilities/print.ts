const print = (message?: unknown, ...optionalParams: unknown[]): void => {
  if (import.meta.env.DEV) console.log(message, ...optionalParams)
}

export default print
