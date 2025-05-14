"use strict";
/**
 * Authentication Request Validation Schemas
 *
 * This module defines Zod validation schemas for authentication-related requests:
 * - User registration with all possible fields
 * - User login with credentials
 * - Token refresh request
 *
 * These schemas are used by the validation middleware to ensure that
 * incoming requests contain valid data before processing.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const user_model_1 = require("../models/user.model");
/**
 * Registration request validation schema
 *
 * Validates user registration data with:
 * - Required fields (email, password, first name, last name)
 * - Optional fields for user profile
 * - Role-specific fields (department, specialization for medical staff, etc.)
 */
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        // Required fields with validation rules
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
        firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters'),
        lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters'),
        // Optional fields with default values
        role: zod_1.z.nativeEnum(user_model_1.UserRole).optional().default(user_model_1.UserRole.PATIENT),
        // Optional user profile fields
        dateOfBirth: zod_1.z.string().optional(),
        gender: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        // Optional medical staff fields
        department: zod_1.z.string().optional(),
        specialization: zod_1.z.string().optional(),
        licenseNumber: zod_1.z.string().optional(),
        // Optional patient fields
        medicalRecordNumber: zod_1.z.string().optional(),
        emergencyContact: zod_1.z.string().optional(),
        bloodType: zod_1.z.string().optional(),
        allergies: zod_1.z.union([zod_1.z.array(zod_1.z.string()), zod_1.z.string()]).optional(),
    }).passthrough() // Allow other fields to pass through for flexibility
});
/**
 * Login request validation schema
 *
 * Validates user login credentials with:
 * - Email format validation
 * - Password presence check
 */
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }).passthrough()
});
/**
 * Token refresh request validation schema
 *
 * Validates token refresh requests with:
 * - Refresh token presence check
 */
exports.refreshTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
    }).passthrough()
});
