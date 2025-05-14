import mongoose, { Document, Schema } from 'mongoose';

export interface IPrescription {
  medicationId?: mongoose.Types.ObjectId;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
  warnings?: string[];
  sideEffects?: string[];
  showWarningsToPatient?: boolean;
}

export interface IVitals {
  bloodPressure?: string;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  height?: number;
  weight?: number;
  oxygenSaturation?: number;
}

export interface IPatientHistory extends Document {
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  visitDate: Date;
  diagnosis: string;
  symptoms: string[];
  notes: string;
  vitals?: IVitals;
  prescriptions: IPrescription[];
  attachments?: string[];
  followUpDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const vitalsSchema = new Schema<IVitals>({
  bloodPressure: String,
  heartRate: Number,
  respiratoryRate: Number,
  temperature: Number,
  height: Number,
  weight: Number,
  oxygenSaturation: Number,
});

const prescriptionSchema = new Schema<IPrescription>({
  medicationId: Schema.Types.ObjectId,
  medication: {
    type: String,
    required: true,
  },
  dosage: {
    type: String,
    required: true,
  },
  frequency: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  notes: String,
  warnings: [String],
  sideEffects: [String],
  showWarningsToPatient: Boolean,
});

const patientHistorySchema = new Schema<IPatientHistory>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    visitDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    diagnosis: {
      type: String,
      required: true,
    },
    symptoms: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      required: true,
    },
    vitals: vitalsSchema,
    prescriptions: {
      type: [prescriptionSchema],
      default: [],
    },
    attachments: {
      type: [String],
      default: [],
    },
    followUpDate: {
      type: Date,
    },
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

const PatientHistory = mongoose.model<IPatientHistory>('PatientHistory', patientHistorySchema);

export default PatientHistory; 