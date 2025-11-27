import pino from "pino";
import { Writable } from "node:stream";

export class LogStream extends Writable {
  logs: string[] = [];

  _write(chunk: any, _encoding: string, callback: () => void) {
    this.logs.push(chunk.toString());
    callback();
  }
}

export function createTestLogger() {
  const logStream = new LogStream();
  return {
    logStream,
    logger: pino(logStream),
  };
}
