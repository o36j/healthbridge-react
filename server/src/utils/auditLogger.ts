import { Request } from 'express';
import AuditLog, { AuditAction } from '../models/auditLog.model';
import mongoose from 'mongoose';
import createLogger from './logger';

const logger = createLogger('AuditLogger');

interface AuditLogParams {
  action: AuditAction;
  performedBy: string | mongoose.Types.ObjectId;
  performedOn?: string | mongoose.Types.ObjectId;
  previousValue?: any;
  newValue?: any;
  details?: string;
  req?: Request;
}

/**
 * Log an audit event
 * 
 * @param params Audit log parameters
 * @returns Promise that resolves to the created audit log
 */
export const logAuditEvent = async ({
  action,
  performedBy,
  performedOn,
  previousValue,
  newValue,
  details,
  req,
}: AuditLogParams): Promise<void> => {
  try {
    // Log audit event details for debugging
    logger.debug('Creating audit log', { 
      action, 
      user: typeof performedBy === 'string' ? performedBy : performedBy.toString(),
      target: performedOn ? (typeof performedOn === 'string' ? performedOn : performedOn.toString()) : undefined,
      details
    });
    
    // Create audit log entry
    const auditLog = new AuditLog({
      action,
      performedBy: typeof performedBy === 'string' ? performedBy : performedBy,
      performedOn: performedOn ? (typeof performedOn === 'string' ? performedOn : performedOn) : undefined,
      previousValue,
      newValue,
      details,
      ip: req?.ip,
      userAgent: req?.headers['user-agent'],
    });
    
    // Save audit log asynchronously (don't await)
    auditLog.save().catch(err => {
      logger.error('Failed to save audit log to database', err);
    });
  } catch (error) {
    logger.error('Error creating audit log', error);
  }
};

/**
 * Get client IP address from request
 * 
 * @param req Express request
 * @returns IP address
 */
export const getClientIp = (req: Request): string => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    return Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0];
  }
  return req.ip || '';
}; 