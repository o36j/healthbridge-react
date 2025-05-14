/**
 * Client-side Logger Utility
 * 
 * Provides structured logging functionality with different log levels.
 * Automatically filters out debug logs in production mode.
 */

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// Check if we're in development mode
const isDev = import.meta.env.MODE === 'development';

/**
 * Format a log message with proper structure
 */
const formatLogMessage = (level: LogLevel, module: string, message: string): string => {
  return `[${level}] [${module}] ${message}`;
};

/**
 * Client logger class for different modules
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
    if (!isDev) return;
    
    const formattedMessage = formatLogMessage(LogLevel.DEBUG, this.module, message);
    console.log(`%c${formattedMessage}`, 'color: #6c757d');
    if (data) console.log(data);
  }
  
  /**
   * Log an informational message.
   */
  info(message: string, data?: any): void {
    const formattedMessage = formatLogMessage(LogLevel.INFO, this.module, message);
    console.log(`%c${formattedMessage}`, 'color: #0275d8');
    if (data) console.log(data);
  }
  
  /**
   * Log a warning message.
   */
  warn(message: string, data?: any): void {
    const formattedMessage = formatLogMessage(LogLevel.WARN, this.module, message);
    console.warn(`%c${formattedMessage}`, 'color: #f0ad4e');
    if (data) console.warn(data);
  }
  
  /**
   * Log an error message.
   */
  error(message: string, error?: any): void {
    const formattedMessage = formatLogMessage(LogLevel.ERROR, this.module, message);
    console.error(`%c${formattedMessage}`, 'color: #d9534f');
    if (error) console.error(error);
  }
  
  /**
   * Log an API request for debugging (development only)
   */
  apiRequest(method: string, url: string): void {
    if (!isDev) return;
    this.debug(`API Request: ${method.toUpperCase()} ${url}`);
  }
  
  /**
   * Log an API response for debugging (development only)
   */
  apiResponse(status: number, url: string): void {
    if (!isDev) return;
    this.debug(`API Response: ${status} ${url}`);
  }
  
  /**
   * Log an API error
   */
  apiError(status: number | string, url: string, data?: any): void {
    this.error(`API Error: ${status} ${url}`, data);
  }
}

/**
 * Create a logger for a specific module
 */
export const createLogger = (module: string): Logger => {
  return new Logger(module);
};

export default createLogger; 