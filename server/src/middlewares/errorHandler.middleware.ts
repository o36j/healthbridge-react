/**
 * Global Error Handler Middleware
 * 
 * This middleware handles all errors thrown during request processing.
 * It provides appropriate error responses based on the environment:
 * - Development: detailed error information with stack traces
 * - Production: sanitized error messages for security
 */

import { Request, Response, NextFunction } from 'express';
import createLogger from '../utils/logger';

const logger = createLogger('ErrorHandler');

interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

/**
 * Central error handling middleware
 * 
 * @param err - Error object thrown during request processing
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
  } else {
    // Production environment: sanitize error messages
    if (err.isOperational) {
      // Operational, trusted errors: send message to client
      logger.warn(`${req.method} ${req.originalUrl} - ${err.message}`);
      
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      // Programming or unknown errors: don't leak error details
      logger.error(`Unexpected error at ${req.method} ${req.originalUrl}`, err);
      
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong!'
      });
    }
  }
};

export default errorHandler; 