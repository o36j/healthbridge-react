import mongoose, { Document, Schema } from 'mongoose';

export enum AuditAction {
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_STATUS_UPDATED = 'user_status_updated',
  DOCTOR_RATING_UPDATED = 'doctor_rating_updated',
  ROLE_UPDATED = 'role_updated',
  PASSWORD_UPDATED = 'password_updated',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
}

export interface IAuditLog extends Document {
  action: AuditAction;
  performedBy: mongoose.Types.ObjectId;
  performedOn?: mongoose.Types.ObjectId;
  previousValue?: any;
  newValue?: any;
  details?: string;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      enum: Object.values(AuditAction),
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performedOn: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    previousValue: {
      type: Schema.Types.Mixed,
    },
    newValue: {
      type: Schema.Types.Mixed,
    },
    details: {
      type: String,
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index for faster querying
auditLogSchema.index({ action: 1, performedBy: 1, performedOn: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

export default AuditLog; 