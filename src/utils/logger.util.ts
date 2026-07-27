type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private prefix: string;

  constructor(prefix = 'QA') {
    this.prefix = prefix;
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] [${this.prefix}] [${level.toUpperCase()}] ${message}`;
    if (data !== undefined) {
      console.log(entry, data);
    } else {
      console.log(entry);
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }
}

export const logger = new Logger('PlaywrightQA');
