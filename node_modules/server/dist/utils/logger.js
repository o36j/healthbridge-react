"use strict";
/**
 * Logger Utility
 *
 * Provides structured logging functionality for the application.
 * Implements consistent formatting and log levels for better debugging.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = exports.Logger = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (LogLevel = {}));
// Determine if we're in development mode
const isDev = process.env.NODE_ENV === 'development';
/**
 * Creates a formatted log message with timestamp, level, and module information
 */
const formatLogMessage = (level, module, message) => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${module}] ${message}`;
};
/**
 * Core logging function
 */
const log = (level, module, message, data) => {
    // In production, only log INFO and above
    if (!isDev && level === LogLevel.DEBUG)
        return;
    const formattedMessage = formatLogMessage(level, module, message);
    switch (level) {
        case LogLevel.ERROR:
            console.error(formattedMessage);
            if (data)
                console.error(data);
            break;
        case LogLevel.WARN:
            console.warn(formattedMessage);
            if (data)
                console.warn(data);
            break;
        case LogLevel.INFO:
            console.log(formattedMessage);
            if (data)
                console.log(data);
            break;
        case LogLevel.DEBUG:
            if (isDev) {
                console.log(formattedMessage);
                if (data)
                    console.log(data);
            }
            break;
    }
};
/**
 * Logger instance for specific module
 */
class Logger {
    constructor(module) {
        this.module = module;
    }
    /**
     * Log a debug message. Only appears in development mode.
     */
    debug(message, data) {
        log(LogLevel.DEBUG, this.module, message, data);
    }
    /**
     * Log an informational message.
     */
    info(message, data) {
        log(LogLevel.INFO, this.module, message, data);
    }
    /**
     * Log a warning message.
     */
    warn(message, data) {
        log(LogLevel.WARN, this.module, message, data);
    }
    /**
     * Log an error message.
     */
    error(message, error) {
        log(LogLevel.ERROR, this.module, message, error);
    }
}
exports.Logger = Logger;
/**
 * Create a logger for a specific module
 */
const createLogger = (module) => {
    return new Logger(module);
};
exports.createLogger = createLogger;
exports.default = exports.createLogger;
