import pino, { Logger } from "pino";

export type LoggerOptions = {
  logLevel?: string;
};

/**
 * Creates a configured pino logger instance for use across lambdas.
 *
 * @param options - Optional configuration for the logger
 * @param options.logLevel - The log level (defaults to "info")
 * @returns A configured pino Logger instance
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const { logLevel = "info" } = options;

  return pino({
    level: logLevel,
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
    timestamp: () => `,"timestamp":"${new Date(Date.now()).toISOString()}"`,
  });
}
