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

import { z } from 'zod';
import { UserRole } from '../models/user.model';

/**
 * Registration request validation schema
 * 
 * Validates user registration data with:
 * - Required fields (email, password, first name, last name)
 * - Optional fields for user profile
 * - Role-specific fields (department, specialization for medical staff, etc.)
 */
export const registerSchema = z.object({
  body: z.object({
    // Required fields with validation rules
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    
    // Optional fields with default values
    role: z.nativeEnum(UserRole).optional().default(UserRole.PATIENT),
    
    // Optional user profile fields
    dateOfBirth: z.string().optional(),
    gender: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    
    // Optional medical staff fields
    department: z.string().optional(),
    specialization: z.string().optional(),
    licenseNumber: z.string().optional(),
    
    // Optional patient fields
    medicalRecordNumber: z.string().optional(),
    emergencyContact: z.string().optional(),
    bloodType: z.string().optional(),
    allergies: z.union([z.array(z.string()), z.string()]).optional(),
  }).passthrough() // Allow other fields to pass through for flexibility
});

/**
 * Login request validation schema
 * 
 * Validates user login credentials with:
 * - Email format validation
 * - Password presence check
 */
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }).passthrough()
});

/**
 * Token refresh request validation schema
 * 
 * Validates token refresh requests with:
 * - Refresh token presence check
 */
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }).passthrough()
}); 