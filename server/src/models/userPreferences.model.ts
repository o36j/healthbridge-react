import mongoose, { Document, Schema } from 'mongoose';

/**
 * Interface for user preferences document
 */
export interface IUserPreferences extends Document {
  userId: mongoose.Types.ObjectId;
  theme: string;
  compactMode: boolean;
  notifications: {
    email: boolean;
    sms: boolean;
    browser: boolean;
  };
  language: string;
  dateFormat: string;
  timeFormat: string;
  updatedAt: Date;
  createdAt: Date;
}

/**
 * Mongoose schema for user preferences
 */
const userPreferencesSchema = new Schema<IUserPreferences>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light'
    },
    compactMode: {
      type: Boolean,
      default: false
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: true
      },
      browser: {
        type: Boolean,
        default: false
      }
    },
    language: {
      type: String,
      enum: ['en', 'es', 'fr', 'de', 'zh'],
      default: 'en'
    },
    dateFormat: {
      type: String,
      enum: ['mm/dd/yyyy', 'dd/mm/yyyy', 'yyyy/mm/dd'],
      default: 'mm/dd/yyyy'
    },
    timeFormat: {
      type: String,
      enum: ['12', '24'],
      default: '12'
    }
  },
  { timestamps: true }
);

const UserPreferences = mongoose.model<IUserPreferences>('UserPreferences', userPreferencesSchema);

export default UserPreferences; 