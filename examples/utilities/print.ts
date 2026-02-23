const print = (message?: any, ...optionalParams: any[]): void => {
  if (import.meta.env.DEV) console.log(message, ...optionalParams);
};

export default print;
