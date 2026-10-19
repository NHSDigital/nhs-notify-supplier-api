import pino, { Logger } from "pino";

export type LoggerOptions = {
  logLevel?: string;
  logReference?: string;
};

/**
 * Creates a configured pino logger instance for use across lambdas.
 *
 * @param options - Optional configuration for the logger
 * @param options.logLevel - The log level (defaults to "info")
 * @param options.logReference - Optional reference value to include on every log record
 * @returns A configured pino Logger instance
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const { logLevel = "info", logReference } = options;

  return pino({
    level: logLevel,
    redact: {
      paths: ["logRef"],
      remove: true,
    },
    mixin: (context) => {
      const messageLogReference =
        "logRef" in context && typeof context.logRef === "string"
          ? context.logRef
          : undefined;

      if (logReference && messageLogReference) {
        return { log_reference: `${logReference} - ${messageLogReference}` };
      }

      return logReference ? { log_reference: logReference } : {};
    },
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
    timestamp: () => `,"timestamp":"${new Date(Date.now()).toISOString()}"`,
  });
}
