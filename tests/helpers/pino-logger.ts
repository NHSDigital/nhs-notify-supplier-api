import pino from "pino";

export const logger: pino.Logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      levelFirst: true,
      translateTime: true,
      ignore: "pid,hostname,time",
    },
  },
});
