"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * Enumeration of available user roles in the system
 */
var UserRole;
(function (UserRole) {
    UserRole["PATIENT"] = "patient";
    UserRole["DOCTOR"] = "doctor";
    UserRole["NURSE"] = "nurse";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
/**
 * Mongoose schema definition for the User model
 */
const userSchema = new mongoose_1.Schema({
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
            type: mongoose_1.Schema.Types.Mixed, // Allow both string and array
            default: undefined
        },
        experience: {
            type: mongoose_1.Schema.Types.Mixed, // Allow both string and number
            default: undefined
        },
        availability: {
            type: mongoose_1.Schema.Types.Mixed, // Allow both string and object
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
}, { timestamps: true } // Automatically add createdAt and updatedAt fields
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
        const salt = await bcryptjs_1.default.genSalt(10);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
/**
 * Method to compare a candidate password with the user's hashed password
 *
 * @param candidatePassword - The plain-text password to compare
 * @returns Promise that resolves to a boolean indicating if the passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
// Create and export the User model
const User = mongoose_1.default.model('User', userSchema);
exports.default = User;
