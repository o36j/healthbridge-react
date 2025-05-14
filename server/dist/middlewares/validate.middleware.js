"use strict";
/**
 * Request Validation Middleware
 *
 * This middleware uses Zod schemas to validate incoming request data,
 * ensuring that it conforms to expected types and formats before
 * processing by route handlers.
 *
 * It validates:
 * - Request body
 * - Query parameters
 * - URL parameters
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
/**
 * Factory function that creates a validation middleware using the provided Zod schema
 *
 * @param schema - Zod schema to validate the request against
 * @returns Middleware function that validates requests using the schema
 */
const validateRequest = (schema) => async (req, res, next) => {
    // For development, skip validation temporarily
    if (process.env.NODE_ENV === 'development') {
        return next();
    }
    try {
        // Validate request data against the provided schema
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            // Handle Zod validation errors with detailed feedback
            // Return formatted validation errors to the client
            res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: error.errors.map(err => ({
                    path: err.path.join('.'),
                    message: err.message
                }))
            });
            return;
        }
        // Handle other types of errors
        res.status(400).json({
            status: 'error',
            message: 'Bad request'
        });
    }
};
exports.validateRequest = validateRequest;
