import mongoose, { Document, Schema } from 'mongoose';

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read'
}

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  content: string;
  status: MessageStatus;
  appointmentId?: mongoose.Types.ObjectId;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.SENT,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Create indexes for faster querying
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ appointmentId: 1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model<IMessage>('Message', messageSchema);

export default Message; 