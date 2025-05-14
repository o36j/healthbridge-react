/**
 * User Model
 * 
 * This model represents users in the HealthBridge system, supporting different roles:
 * - Patients: Regular users who can book appointments and access their medical records
 * - Doctors: Medical professionals who can manage appointments and patient records
 * - Nurses: Medical staff who assist doctors and manage patient care
 * - Admins: System administrators with full access to all features
 * 
 * The model includes fields common to all users, as well as role-specific fields.
 */

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Enumeration of available user roles in the system
 */
export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  ADMIN = 'admin',
}

/**
 * Interface for professional profile data
 */
interface ProfessionalProfile {
  bio?: string;
  education?: string[] | string;
  experience?: string | number;
  availability?: string | {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  consultationFee?: string;
  acceptingNewPatients?: boolean;
  telehealth?: boolean;
}

/**
 * Interface for field visibility settings
 */
interface VisibilitySettings {
  phone: boolean;
  email: boolean;
  department: boolean;
  specialization: boolean;
  licenseNumber: boolean;
  bio: boolean;
  education: boolean;
  experience: boolean;
}

/**
 * Interface for security settings
 */
interface SecuritySettings {
  loginNotifications: boolean;
  sessionTimeout: string;
}

/**
 * Interface for user preferences
 */
interface UserPreferences {
  theme?: string;
  language?: string;
  dateFormat?: string;
  timeFormat?: string;
  security?: SecuritySettings;
}

/**
 * User document interface defining the structure and methods of a user
 * Extends the Mongoose Document type
 */
export interface IUser extends Document {
  // Common fields for all users
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: string;
  phone?: string;
  address?: string;
  profilePhoto?: string;
  location?: string;
  lastLogin?: Date;
  active?: boolean;
  
  // Fields specific to medical staff (doctors and nurses)
  department?: string;
  specialization?: string;
  licenseNumber?: string;
  rating?: number;
  ratingCount?: number;
  
  // Advanced professional profile for doctors and nurses
  professionalProfile?: ProfessionalProfile;
  
  // Visibility settings for fields
  visibilitySettings?: VisibilitySettings;
  
  // User preferences
  preferences?: UserPreferences;
  
  // Fields specific to patients
  medicalRecordNumber?: string;
  emergencyContact?: string;
  bloodType?: string;
  allergies?: string[];
  
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  
  // Timestamps automatically added by Mongoose
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema definition for the User model
 */
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      required: true,
      enum: Object.values(UserRole),
      default: UserRole.PATIENT,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer not to say'],
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    profilePhoto: {
      type: String,
    },
    location: {
      type: String,
    },
    lastLogin: {
      type: Date,
    },
    active: {
      type: Boolean,
      default: true,
    },
    
    // Fields for medical staff
    department: {
      type: String,
    },
    specialization: {
      type: String,
    },
    licenseNumber: {
      type: String,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    
    // Professional profile for doctors and nurses
    professionalProfile: {
      bio: String,
      education: {
        type: Schema.Types.Mixed, // Allow both string and array
        default: undefined
      },
      experience: {
        type: Schema.Types.Mixed, // Allow both string and number
        default: undefined
      },
      availability: {
        type: Schema.Types.Mixed, // Allow both string and object
        default: undefined
      },
      consultationFee: String,
      acceptingNewPatients: {
        type: Boolean,
        default: true
      },
      telehealth: {
        type: Boolean,
        default: false
      }
    },
    
    // Visibility settings
    visibilitySettings: {
      phone: {
        type: Boolean,
        default: false
      },
      email: {
        type: Boolean,
        default: false
      },
      department: {
        type: Boolean,
        default: true
      },
      specialization: {
        type: Boolean,
        default: true
      },
      licenseNumber: {
        type: Boolean,
        default: false
      },
      bio: {
        type: Boolean,
        default: true
      },
      education: {
        type: Boolean,
        default: true
      },
      experience: {
        type: Boolean,
        default: true
      }
    },
    
    // User preferences
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'light'
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
      },
      security: {
        loginNotifications: {
          type: Boolean,
          default: true
        },
        sessionTimeout: {
          type: String,
          enum: ['15', '30', '60', '120', '240'],
          default: '60'
        }
      }
    },
    
    // Fields for patients
    medicalRecordNumber: {
      type: String,
    },
    emergencyContact: {
      type: String,
    },
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    allergies: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

/**
 * Middleware executed before saving a user document
 * Automatically hashes the password if it has been modified
 */
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Generate salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

/**
 * Method to compare a candidate password with the user's hashed password
 * 
 * @param candidatePassword - The plain-text password to compare
 * @returns Promise that resolves to a boolean indicating if the passwords match
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create and export the User model
const User = mongoose.model<IUser>('User', userSchema);

export default User; 