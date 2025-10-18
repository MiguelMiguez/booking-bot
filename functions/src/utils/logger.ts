type LogLevel = "info" | "error" | "warn" | "debug";

const format = (level: LogLevel, message: string): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
};

export const logger = {
  info: (message: string): void => {
    console.log(format("info", message));
  },
  warn: (message: string): void => {
    console.warn(format("warn", message));
  },
  error: (message: string, error?: unknown): void => {
    if (error instanceof Error) {
      console.error(format("error", `${message} - ${error.message}`));
      if (error.stack) {
        console.error(error.stack);
      }
      return;
    }

    if (typeof error === "string") {
      console.error(format("error", `${message} - ${error}`));
      return;
    }

    console.error(format("error", message));
  },
  debug: (message: string): void => {
    if (process.env.NODE_ENV === "development") {
      console.debug(format("debug", message));
    }
  },
};
