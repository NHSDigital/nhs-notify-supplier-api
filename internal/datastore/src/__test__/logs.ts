import pino from 'pino';
import { Writable } from 'stream';

export class LogStream extends Writable {
  logs: string[] = [];

  _write(chunk: any, _encoding: string, callback: () => void) {
    this.logs.push(chunk.toString());
    callback();
  }
}

export function createTestLogger() {
  let logStream = new LogStream();
  return {
    logStream: logStream,
    logger: pino(logStream)
  };
}
