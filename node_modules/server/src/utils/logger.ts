/**
 * Logger Utility
 * 
 * Provides structured logging functionality for the application.
 * Implements consistent formatting and log levels for better debugging.
 */

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// Determine if we're in development mode
const isDev = process.env.NODE_ENV === 'development';

/**
 * Creates a formatted log message with timestamp, level, and module information
 */
const formatLogMessage = (level: LogLevel, module: string, message: string): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] [${module}] ${message}`;
};

/**
 * Core logging function
 */
const log = (level: LogLevel, module: string, message: string, data?: any): void => {
  // In production, only log INFO and above
  if (!isDev && level === LogLevel.DEBUG) return;
  
  const formattedMessage = formatLogMessage(level, module, message);
  
  switch (level) {
    case LogLevel.ERROR:
      console.error(formattedMessage);
      if (data) console.error(data);
      break;
    case LogLevel.WARN:
      console.warn(formattedMessage);
      if (data) console.warn(data);
      break;
    case LogLevel.INFO:
      console.log(formattedMessage);
      if (data) console.log(data);
      break;
    case LogLevel.DEBUG:
      if (isDev) {
        console.log(formattedMessage);
        if (data) console.log(data);
      }
      break;
  }
};

/**
 * Logger instance for specific module
 */
export class Logger {
  private module: string;
  
  constructor(module: string) {
    this.module = module;
  }
  
  /**
   * Log a debug message. Only appears in development mode.
   */
  debug(message: string, data?: any): void {
    log(LogLevel.DEBUG, this.module, message, data);
  }
  
  /**
   * Log an informational message.
   */
  info(message: string, data?: any): void {
    log(LogLevel.INFO, this.module, message, data);
  }
  
  /**
   * Log a warning message.
   */
  warn(message: string, data?: any): void {
    log(LogLevel.WARN, this.module, message, data);
  }
  
  /**
   * Log an error message.
   */
  error(message: string, error?: any): void {
    log(LogLevel.ERROR, this.module, message, error);
  }
}

/**
 * Create a logger for a specific module
 */
export const createLogger = (module: string): Logger => {
  return new Logger(module);
};

export default createLogger; 