import mongoose, { Document, Schema } from 'mongoose';

export enum NotificationType {
  APPOINTMENT_CREATED = 'appointment_created',
  APPOINTMENT_UPDATED = 'appointment_updated',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_CONFIRMED = 'appointment_confirmed',
  MESSAGE_RECEIVED = 'message_received',
  LAB_RESULTS = 'lab_results',
  PRESCRIPTION = 'prescription',
  SYSTEM = 'system'
}

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  relatedId?: mongoose.Types.ObjectId;
  relatedModel?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
      refPath: 'relatedModel',
    },
    relatedModel: {
      type: String,
      enum: ['Appointment', 'Message', 'PatientHistory'],
      validate: {
        validator: function(this: any, value: any) {
          // Only require relatedModel if relatedId is provided
          return this.relatedId ? !!value : true;
        },
        message: 'RelatedModel is required when relatedId is provided'
      }
    }
  },
  { timestamps: true }
);

// Create indexes for faster querying
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification; 