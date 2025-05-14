"use strict";
/**
 * Global Error Handler Middleware
 *
 * This middleware handles all errors thrown during request processing.
 * It provides appropriate error responses based on the environment:
 * - Development: detailed error information with stack traces
 * - Production: sanitized error messages for security
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const logger = (0, logger_1.default)('ErrorHandler');
/**
 * Central error handling middleware
 *
 * @param err - Error object thrown during request processing
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        // Development environment: provide detailed error information
        logger.error(`${req.method} ${req.originalUrl}`, err);
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }
    else {
        // Production environment: sanitize error messages
        if (err.isOperational) {
            // Operational, trusted errors: send message to client
            logger.warn(`${req.method} ${req.originalUrl} - ${err.message}`);
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }
        else {
            // Programming or unknown errors: don't leak error details
            logger.error(`Unexpected error at ${req.method} ${req.originalUrl}`, err);
            res.status(500).json({
                status: 'error',
                message: 'Something went wrong!'
            });
        }
    }
};
exports.default = errorHandler;
