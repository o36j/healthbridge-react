"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientIp = exports.logAuditEvent = void 0;
const auditLog_model_1 = __importDefault(require("../models/auditLog.model"));
const logger_1 = __importDefault(require("./logger"));
const logger = (0, logger_1.default)('AuditLogger');
/**
 * Log an audit event
 *
 * @param params Audit log parameters
 * @returns Promise that resolves to the created audit log
 */
const logAuditEvent = async ({ action, performedBy, performedOn, previousValue, newValue, details, req, }) => {
    try {
        // Log audit event details for debugging
        logger.debug('Creating audit log', {
            action,
            user: typeof performedBy === 'string' ? performedBy : performedBy.toString(),
            target: performedOn ? (typeof performedOn === 'string' ? performedOn : performedOn.toString()) : undefined,
            details
        });
        // Create audit log entry
        const auditLog = new auditLog_model_1.default({
            action,
            performedBy: typeof performedBy === 'string' ? performedBy : performedBy,
            performedOn: performedOn ? (typeof performedOn === 'string' ? performedOn : performedOn) : undefined,
            previousValue,
            newValue,
            details,
            ip: req === null || req === void 0 ? void 0 : req.ip,
            userAgent: req === null || req === void 0 ? void 0 : req.headers['user-agent'],
        });
        // Save audit log asynchronously (don't await)
        auditLog.save().catch(err => {
            logger.error('Failed to save audit log to database', err);
        });
    }
    catch (error) {
        logger.error('Error creating audit log', error);
    }
};
exports.logAuditEvent = logAuditEvent;
/**
 * Get client IP address from request
 *
 * @param req Express request
 * @returns IP address
 */
const getClientIp = (req) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        return Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0];
    }
    return req.ip || '';
};
exports.getClientIp = getClientIp;
