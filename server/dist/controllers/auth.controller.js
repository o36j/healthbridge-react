"use strict";
/**
 * Authentication Controller
 *
 * This controller handles all authentication-related operations:
 * - User registration with profile photo upload
 * - User login and token generation
 * - Token refresh for extending sessions
 * - User logout
 * - Retrieving authenticated user profile
 *
 * Authentication is implemented using JWT tokens stored in HTTP-only cookies.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const user_model_1 = __importStar(require("../models/user.model"));
const auth_utils_1 = require("../utils/auth.utils");
/**
 * Register a new user
 *
 * Creates a new user account with the provided information,
 * handles profile photo upload, and generates authentication tokens.
 *
 * @param req - Express request object containing user registration data
 * @param res - Express response object
 */
const register = async (req, res) => {
    try {
        console.log('Register route called');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('Request file:', req.file);
        const { email, password, firstName, lastName, role } = req.body;
        console.log('Extracted data:', { email, firstName, lastName, role });
        // Check if user already exists
        const existingUser = await user_model_1.default.findOne({ email });
        if (existingUser) {
            console.log('User already exists with email:', email);
            res.status(400).json({ message: 'User already exists with this email' });
            return;
        }
        // Validate role (don't allow admin registration directly)
        if (role === user_model_1.UserRole.ADMIN) {
            console.log('Admin registration attempt rejected');
            res.status(403).json({ message: 'Admin registration not allowed' });
            return;
        }
        // Create new user with profile photo if uploaded
        const userData = {
            email,
            password,
            firstName,
            lastName,
            role: role || user_model_1.UserRole.PATIENT,
        };
        // Handle profile photo if it was uploaded
        if (req.file) {
            // Store the path relative to the server
            userData.profilePhoto = `/uploads/${req.file.filename}`;
            console.log('Profile photo path:', userData.profilePhoto);
        }
        // Add optional fields if present
        if (req.body.department)
            userData.department = req.body.department;
        if (req.body.specialization)
            userData.specialization = req.body.specialization;
        if (req.body.location)
            userData.location = req.body.location;
        // Handle professional profile data for doctors
        if (role === user_model_1.UserRole.DOCTOR) {
            userData.professionalProfile = {
                bio: req.body.bio,
                consultationFee: req.body.consultationFee,
                acceptingNewPatients: req.body.acceptsNewPatients === 'true',
                telehealth: req.body.telehealth === 'true'
            };
            // Handle education - ensure it's stored as an array
            if (req.body.education) {
                try {
                    userData.professionalProfile.education = JSON.parse(req.body.education);
                }
                catch (e) {
                    // If JSON parsing fails, use the string as is
                    userData.professionalProfile.education = req.body.education;
                }
            }
            // Handle experience - could be a number or string
            if (req.body.experience) {
                const exp = Number(req.body.experience);
                userData.professionalProfile.experience = !isNaN(exp) ? exp : req.body.experience;
            }
            // Handle availability schedule
            if (req.body.availability) {
                try {
                    userData.professionalProfile.availability = JSON.parse(req.body.availability);
                }
                catch (e) {
                    // If JSON parsing fails, use the string as is
                    userData.professionalProfile.availability = req.body.availability;
                }
            }
        }
        const user = new user_model_1.default(userData);
        await user.save();
        // Check if current user is an admin creating another user
        const isAdminCreatingUser = req.user && req.user.role === user_model_1.UserRole.ADMIN;
        // Only set auth cookies if this is NOT an admin creating a user
        if (!isAdminCreatingUser) {
            // Generate tokens
            const accessToken = (0, auth_utils_1.generateToken)({
                id: user._id.toString(),
                email: user.email,
                role: user.role,
            });
            const refreshToken = (0, auth_utils_1.generateRefreshToken)({
                id: user._id.toString(),
                email: user.email,
                role: user.role,
            });
            // Set cookies
            res.cookie('token', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000, // 1 day
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
        }
        // Send response (without password)
        const userResponse = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        };
        res.status(201).json({
            message: 'User registered successfully',
            user: userResponse,
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.register = register;
/**
 * Authenticate a user
 *
 * Verifies user credentials, generates authentication tokens,
 * and returns user information on successful login.
 *
 * @param req - Express request object containing login credentials
 * @param res - Express response object
 */
const login = async (req, res) => {
    var _a;
    try {
        const { email, password } = req.body;
        // Find user
        const user = await user_model_1.default.findOne({ email });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        // Generate tokens
        const accessToken = (0, auth_utils_1.generateToken)({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        });
        const refreshToken = (0, auth_utils_1.generateRefreshToken)({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        });
        // Special logging for admin users
        const isAdmin = user.role === user_model_1.UserRole.ADMIN;
        if (isAdmin) {
            console.log('Admin user login:', user.email);
            (0, auth_utils_1.logCookieOperation)(req, 'before_login_admin', 'all');
        }
        // Get the domain from request for setting cookies
        const domain = ((_a = req.get('host')) === null || _a === void 0 ? void 0 : _a.split(':')[0]) || undefined;
        // Set cookies with explicit cookie options
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            domain: domain !== 'localhost' ? domain : undefined,
            sameSite: 'lax'
        };
        // Set access token cookie
        res.cookie('token', accessToken, {
            ...cookieOptions,
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });
        // Set refresh token cookie
        res.cookie('refreshToken', refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        if (isAdmin) {
            (0, auth_utils_1.logCookieOperation)(req, 'after_login_admin', 'all');
        }
        // Send response (without password)
        const userResponse = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            profilePhoto: user.profilePhoto,
        };
        res.status(200).json({
            message: 'Login successful',
            user: userResponse,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.login = login;
/**
 * Refresh authentication token
 *
 * Uses the refresh token to generate a new access token,
 * extending the user's session without requiring re-login.
 *
 * @param req - Express request object containing refresh token
 * @param res - Express response object
 */
const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            res.status(401).json({ message: 'Refresh token not found' });
            return;
        }
        // Verify refresh token
        const decoded = (0, auth_utils_1.verifyRefreshToken)(refreshToken);
        // Check if user still exists
        const user = await user_model_1.default.findById(decoded.id);
        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }
        // Generate new access token
        const accessToken = (0, auth_utils_1.generateToken)({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        });
        // Set new access token
        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });
        res.status(200).json({ message: 'Token refreshed successfully' });
    }
    catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};
exports.refreshToken = refreshToken;
/**
 * Log out user
 *
 * Clears authentication cookies to end the user's session.
 *
 * @param req - Express request object
 * @param res - Express response object
 */
const logout = (req, res) => {
    var _a, _b, _c;
    try {
        console.log('Processing logout request for user:', (_a = req.user) === null || _a === void 0 ? void 0 : _a.email, 'Role:', (_b = req.user) === null || _b === void 0 ? void 0 : _b.role);
        (0, auth_utils_1.logCookieOperation)(req, 'before_logout', 'all');
        // Get the domain from request for setting cookies
        const domain = ((_c = req.get('host')) === null || _c === void 0 ? void 0 : _c.split(':')[0]) || undefined;
        // Clear cookies with various option combinations to ensure they're removed
        res.cookie('token', '', {
            maxAge: 0,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            domain: domain !== 'localhost' ? domain : undefined
        });
        (0, auth_utils_1.logCookieOperation)(req, 'clear', 'token');
        res.cookie('refreshToken', '', {
            maxAge: 0,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            domain: domain !== 'localhost' ? domain : undefined
        });
        (0, auth_utils_1.logCookieOperation)(req, 'clear', 'refreshToken');
        // Also try with different settings just to be sure
        res.clearCookie('token');
        res.clearCookie('refreshToken');
        console.log('Logout successful, cookies cleared');
        res.status(200).json({ message: 'Logout successful' });
    }
    catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ message: 'An error occurred during logout' });
    }
};
exports.logout = logout;
/**
 * Get authenticated user information
 *
 * Retrieves the current user's profile information based on their
 * authentication token. Requires the user to be authenticated.
 *
 * @param req - Express request object containing authenticated user
 * @param res - Express response object
 */
const getMe = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const user = await user_model_1.default.findById(userId).select('-password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                profilePhoto: user.profilePhoto,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                phone: user.phone,
                address: user.address,
                // Medical staff specific fields
                department: user.department,
                specialization: user.specialization,
                licenseNumber: user.licenseNumber,
                rating: user.rating,
                // Patient specific fields
                medicalRecordNumber: user.medicalRecordNumber,
                emergencyContact: user.emergencyContact,
                bloodType: user.bloodType,
                allergies: user.allergies,
            }
        });
    }
    catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getMe = getMe;
