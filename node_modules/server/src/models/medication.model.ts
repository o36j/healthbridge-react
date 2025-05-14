import mongoose, { Document, Schema } from 'mongoose';

export interface IMedication extends Document {
  name: string;
  description?: string;
  warnings?: string[];
  sideEffects?: string[];
  dosageForm?: string; // tablet, liquid, etc.
  strength?: string;
  manufacturer?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const medicationSchema = new Schema<IMedication>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    warnings: {
      type: [String],
      default: [],
    },
    sideEffects: {
      type: [String],
      default: [],
    },
    dosageForm: String,
    strength: String,
    manufacturer: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Create a text index for search functionality
medicationSchema.index({ name: 'text', description: 'text' });

const Medication = mongoose.model<IMedication>('Medication', medicationSchema);

export default Medication; 