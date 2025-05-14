"use strict";
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
exports.getProviderPublicProfile = exports.updateDoctorRating = exports.deleteUser = exports.updateUserRole = exports.getMedicalStaffPatients = exports.getAllUsers = exports.changePassword = exports.uploadProfilePhoto = exports.updateUserProfile = exports.getUserProfile = exports.getPublicDoctors = void 0;
const user_model_1 = __importStar(require("../models/user.model"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const auditLogger_1 = require("../utils/auditLogger");
const auditLog_model_1 = require("../models/auditLog.model");
const logger_1 = __importDefault(require("../utils/logger"));
const logger = (0, logger_1.default)('UserController');
// Get all doctors for public access
const getPublicDoctors = async (req, res) => {
    try {
        logger.info('Fetching public doctors data', { route: req.originalUrl });
        const { search, page = '1', limit = '10' } = req.query;
        // Parse pagination parameters
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;
        // Start with a less restrictive query to find any doctors
        let query = { role: user_model_1.UserRole.DOCTOR };
        // Get total user/doctor counts for diagnostics
        const totalUsers = await user_model_1.default.countDocuments({});
        const totalDoctors = await user_model_1.default.countDocuments({ role: user_model_1.UserRole.DOCTOR });
        logger.debug('Database statistics', { totalUsers, totalDoctors });
        // Search by name if provided
        if (search) {
            const searchRegex = new RegExp(search.toString(), 'i');
            query.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { department: searchRegex },
                { specialization: searchRegex },
            ];
            logger.debug(`Search applied with term: ${search}`);
        }
        logger.debug('Query constructed', { query: JSON.stringify(query) });
        // Get total count for the applied filters (for pagination info)
        const totalFilteredDoctors = await user_model_1.default.countDocuments(query);
        // Apply pagination to query
        const doctors = await user_model_1.default.find(query)
            .select('-password -emergencyContact -medicalRecordNumber')
            .skip(skip)
            .limit(limitNumber)
            .sort({ firstName: 1 });
        logger.info(`Found ${doctors.length} doctors matching query`, {
            total: totalFilteredDoctors,
            page: pageNumber,
            limit: limitNumber
        });
        if (doctors.length === 0 && totalDoctors === 0) {
            logger.warn('No doctors found in the database. Consider seeding with doctor data.');
        }
        // Format doctor data for public consumption
        const formattedDoctors = doctors.map(doctor => {
            // Use visibility settings to determine what information to expose
            const visibilitySettings = doctor.visibilitySettings || {
                phone: false,
                email: false,
                department: true,
                specialization: true,
                licenseNumber: false,
                bio: true,
                education: true,
                experience: true
            };
            return {
                _id: doctor._id,
                firstName: doctor.firstName,
                lastName: doctor.lastName,
                profilePhoto: doctor.profilePhoto,
                role: doctor.role,
                department: visibilitySettings.department ? doctor.department : undefined,
                specialization: visibilitySettings.specialization ? doctor.specialization : undefined,
                rating: doctor.rating,
                ratingCount: doctor.ratingCount,
                phone: visibilitySettings.phone ? doctor.phone : undefined,
                location: doctor.location,
                createdAt: doctor.createdAt,
                lastLogin: doctor.lastLogin,
                active: doctor.active,
                education: visibilitySettings.education && doctor.professionalProfile ? doctor.professionalProfile.education : undefined,
                acceptsNewPatients: doctor.professionalProfile ? doctor.professionalProfile.acceptingNewPatients : undefined,
                experience: visibilitySettings.experience && doctor.professionalProfile ? doctor.professionalProfile.experience : undefined,
                telehealth: doctor.professionalProfile ? doctor.professionalProfile.telehealth : undefined,
                availability: doctor.professionalProfile ? doctor.professionalProfile.availability : undefined,
            };
        });
        logger.debug(`Returning ${formattedDoctors.length} formatted doctors`);
        res.status(200).json({
            users: formattedDoctors,
            pagination: {
                total: totalFilteredDoctors,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(totalFilteredDoctors / limitNumber),
                hasMore: pageNumber < Math.ceil(totalFilteredDoctors / limitNumber)
            }
        });
    }
    catch (error) {
        logger.error('Failed to get public doctors', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getPublicDoctors = getPublicDoctors;
// Get user profile
const getUserProfile = async (req, res) => {
    var _a, _b;
    try {
        const userId = req.params.id;
        const user = await user_model_1.default.findById(userId).select('-password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Only allow users to view their own profile, unless they're medical staff or admin
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== userId &&
            ![user_model_1.UserRole.ADMIN, user_model_1.UserRole.DOCTOR, user_model_1.UserRole.NURSE].includes((_b = req.user) === null || _b === void 0 ? void 0 : _b.role)) {
            res.status(403).json({ message: 'Not authorized to view this profile' });
            return;
        }
        res.status(200).json({ user });
    }
    catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserProfile = getUserProfile;
// Update user profile
const updateUserProfile = async (req, res) => {
    var _a, _b, _c, _d;
    try {
        const userId = req.params.id;
        console.log('Update profile request for user ID:', userId);
        console.log('Authenticated user:', req.user);
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        // Check if userId is valid
        if (!userId) {
            console.error('Invalid user ID provided');
            res.status(400).json({ message: 'Invalid user ID provided' });
            return;
        }
        // Only allow users to update their own profile, unless they're an admin
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== userId && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== user_model_1.UserRole.ADMIN) {
            console.error('Authorization failure - User can only update their own profile');
            console.error('Request user ID:', (_c = req.user) === null || _c === void 0 ? void 0 : _c.id);
            console.error('Target user ID:', userId);
            console.error('User role:', (_d = req.user) === null || _d === void 0 ? void 0 : _d.role);
            res.status(403).json({
                message: 'Not authorized to update this profile',
                detail: 'You can only update your own profile unless you are an administrator'
            });
            return;
        }
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            console.error('User not found with ID:', userId);
            res.status(404).json({ message: 'User not found' });
            return;
        }
        console.log('Found user:', user._id, user.email);
        // Fields to update (excluding password and role which have separate endpoints)
        const { email, firstName, lastName, dateOfBirth, gender, phone, address, department, specialization, licenseNumber, medicalRecordNumber, emergencyContact, bloodType, allergies, professionalProfile, visibilitySettings } = req.body;
        // Log received fields for debugging
        console.log('Received fields for update:', {
            email, firstName, lastName, dateOfBirth, gender, phone, address,
            department, specialization, licenseNumber,
            medicalRecordNumber, emergencyContact, bloodType, allergies,
            professionalProfile, visibilitySettings
        });
        // Handle email updates - check for uniqueness
        if (email !== undefined && email !== user.email) {
            // Check if the new email is already taken
            const existingUserWithEmail = await user_model_1.default.findOne({ email });
            if (existingUserWithEmail && String(existingUserWithEmail._id) !== String(user._id)) {
                console.error('Email already in use by another account');
                res.status(400).json({ message: 'Email already in use by another account' });
                return;
            }
            // Email is unique, can be updated
            user.email = email;
            console.log('Updating email to:', email);
        }
        // Update fields conditionally
        if (firstName !== undefined)
            user.firstName = firstName;
        if (lastName !== undefined)
            user.lastName = lastName;
        if (dateOfBirth)
            user.dateOfBirth = new Date(dateOfBirth);
        if (gender !== undefined)
            user.gender = gender;
        if (phone !== undefined)
            user.phone = phone;
        if (address !== undefined)
            user.address = address;
        // Update role-specific fields
        if (user.role === user_model_1.UserRole.DOCTOR || user.role === user_model_1.UserRole.NURSE) {
            if (department !== undefined)
                user.department = department;
            if (specialization !== undefined)
                user.specialization = specialization;
            if (licenseNumber !== undefined)
                user.licenseNumber = licenseNumber;
            // Update professional profile if provided
            if (professionalProfile) {
                if (!user.professionalProfile) {
                    user.professionalProfile = {};
                }
                if (professionalProfile.bio !== undefined)
                    user.professionalProfile.bio = professionalProfile.bio;
                if (professionalProfile.education !== undefined)
                    user.professionalProfile.education = professionalProfile.education;
                if (professionalProfile.experience !== undefined)
                    user.professionalProfile.experience = professionalProfile.experience;
                // Doctor-specific fields
                if (user.role === user_model_1.UserRole.DOCTOR) {
                    if (professionalProfile.availability !== undefined)
                        user.professionalProfile.availability = professionalProfile.availability;
                    if (professionalProfile.consultationFee !== undefined)
                        user.professionalProfile.consultationFee = professionalProfile.consultationFee;
                    if (professionalProfile.acceptingNewPatients !== undefined) {
                        user.professionalProfile.acceptingNewPatients = professionalProfile.acceptingNewPatients;
                    }
                }
            }
            // Update visibility settings if provided
            if (visibilitySettings) {
                if (!user.visibilitySettings) {
                    user.visibilitySettings = {
                        phone: false,
                        email: false,
                        department: true,
                        specialization: true,
                        licenseNumber: false,
                        bio: true,
                        education: true,
                        experience: true
                    };
                }
                if (visibilitySettings.phone !== undefined)
                    user.visibilitySettings.phone = visibilitySettings.phone;
                if (visibilitySettings.email !== undefined)
                    user.visibilitySettings.email = visibilitySettings.email;
                if (visibilitySettings.department !== undefined)
                    user.visibilitySettings.department = visibilitySettings.department;
                if (visibilitySettings.specialization !== undefined)
                    user.visibilitySettings.specialization = visibilitySettings.specialization;
                if (visibilitySettings.licenseNumber !== undefined)
                    user.visibilitySettings.licenseNumber = visibilitySettings.licenseNumber;
                if (visibilitySettings.bio !== undefined)
                    user.visibilitySettings.bio = visibilitySettings.bio;
                if (visibilitySettings.education !== undefined)
                    user.visibilitySettings.education = visibilitySettings.education;
                if (visibilitySettings.experience !== undefined)
                    user.visibilitySettings.experience = visibilitySettings.experience;
            }
        }
        if (user.role === user_model_1.UserRole.PATIENT) {
            if (medicalRecordNumber !== undefined)
                user.medicalRecordNumber = medicalRecordNumber;
            if (emergencyContact !== undefined)
                user.emergencyContact = emergencyContact;
            if (bloodType !== undefined)
                user.bloodType = bloodType;
            if (allergies !== undefined) {
                // Handle allergies - ensure it's an array or set to empty array if undefined
                user.allergies = Array.isArray(allergies) ? allergies : (allergies ? [allergies] : []);
            }
        }
        console.log('Saving updated user data...');
        await user.save();
        console.log('User data saved successfully');
        // Create response with role-specific fields
        const userData = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phone: user.phone,
            address: user.address,
            gender: user.gender,
            profilePhoto: user.profilePhoto,
            // Include other fields based on role
            ...(user.role === user_model_1.UserRole.PATIENT
                ? {
                    bloodType: user.bloodType,
                    allergies: user.allergies,
                    emergencyContact: user.emergencyContact,
                }
                : {}),
            ...(user.role === user_model_1.UserRole.DOCTOR || user.role === user_model_1.UserRole.NURSE
                ? {
                    department: user.department,
                    specialization: user.specialization,
                    licenseNumber: user.licenseNumber,
                    professionalProfile: user.professionalProfile,
                    visibilitySettings: user.visibilitySettings
                }
                : {}),
        };
        res.status(200).json({
            message: 'Profile updated successfully',
            user: userData,
        });
    }
    catch (error) {
        console.error('Update user profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateUserProfile = updateUserProfile;
// Upload profile photo
const uploadProfilePhoto = async (req, res) => {
    try {
        const userId = req.params.id;
        // Temporarily bypass authorization check for testing
        /*
        // Only allow users to update their own profile photo, unless they're an admin
        if (req.user?.id !== userId && req.user?.role !== UserRole.ADMIN) {
          res.status(403).json({ message: 'Not authorized to update this profile' });
          return;
        }
        */
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        console.log('File uploaded:', req.file);
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            // Remove the uploaded file if user not found
            fs_1.default.unlinkSync(req.file.path);
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Remove old profile photo if exists
        if (user.profilePhoto) {
            const oldPhotoPath = path_1.default.join(__dirname, '../../uploads', path_1.default.basename(user.profilePhoto));
            if (fs_1.default.existsSync(oldPhotoPath)) {
                fs_1.default.unlinkSync(oldPhotoPath);
            }
        }
        // Set new profile photo path
        const relativePath = `/uploads/${req.file.filename}`;
        user.profilePhoto = relativePath;
        await user.save();
        // Get server URL from request
        let serverUrl = `${req.protocol}://${req.get('host')}`;
        console.log('Server URL:', serverUrl);
        // Construct full photo URL
        const fullPhotoUrl = `${serverUrl}${relativePath}`;
        console.log('Full photo URL:', fullPhotoUrl);
        res.status(200).json({
            message: 'Profile photo uploaded successfully',
            profilePhoto: relativePath,
            fullPhotoUrl: fullPhotoUrl,
        });
    }
    catch (error) {
        console.error('Upload profile photo error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.uploadProfilePhoto = uploadProfilePhoto;
// Change password
const changePassword = async (req, res) => {
    var _a, _b, _c;
    try {
        const userId = req.params.id;
        // Only allow users to change their own password, unless they're an admin
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== userId && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== user_model_1.UserRole.ADMIN) {
            res.status(403).json({ message: 'Not authorized to change this password' });
            return;
        }
        const { currentPassword, newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            res.status(400).json({ message: 'New password must be at least 6 characters' });
            return;
        }
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Admin can change password without knowing current password
        if (((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) !== user_model_1.UserRole.ADMIN) {
            if (!currentPassword) {
                res.status(400).json({ message: 'Current password is required' });
                return;
            }
            // Verify current password
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                res.status(401).json({ message: 'Current password is incorrect' });
                return;
            }
        }
        // Update password
        user.password = newPassword;
        await user.save();
        res.status(200).json({ message: 'Password updated successfully' });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.changePassword = changePassword;
// Admin: Get all users
const getAllUsers = async (req, res) => {
    var _a;
    try {
        // Only admin can get all users
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== user_model_1.UserRole.ADMIN) {
            res.status(403).json({ message: 'Not authorized to access this resource' });
            return;
        }
        const { role, search } = req.query;
        let query = {};
        // Filter by role if provided
        if (role) {
            query.role = role;
        }
        // Search by name or email if provided
        if (search) {
            const searchRegex = new RegExp(search.toString(), 'i');
            query.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex },
            ];
        }
        const users = await user_model_1.default.find(query).select('-password');
        res.status(200).json({ users });
    }
    catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllUsers = getAllUsers;
// Medical Staff: Get patients for doctors and nurses
const getMedicalStaffPatients = async (req, res) => {
    var _a, _b;
    try {
        // Only medical staff (doctors and nurses) can get patient data
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== user_model_1.UserRole.DOCTOR && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== user_model_1.UserRole.NURSE) {
            res.status(403).json({ message: 'Not authorized to access patient data' });
            return;
        }
        const { search } = req.query;
        // Always filter for patient role only
        let query = { role: user_model_1.UserRole.PATIENT };
        // Search by name or email if provided
        if (search) {
            const searchRegex = new RegExp(search.toString(), 'i');
            query.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex },
            ];
        }
        const patients = await user_model_1.default.find(query).select('-password');
        res.status(200).json({ users: patients });
    }
    catch (error) {
        console.error('Get patients error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getMedicalStaffPatients = getMedicalStaffPatients;
// Admin: Update user role
const updateUserRole = async (req, res) => {
    var _a;
    try {
        // Only admin can update user roles
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== user_model_1.UserRole.ADMIN) {
            res.status(403).json({ message: 'Not authorized to update user roles' });
            return;
        }
        const userId = req.params.id;
        const { role } = req.body;
        // Validate role
        if (!Object.values(user_model_1.UserRole).includes(role)) {
            res.status(400).json({ message: 'Invalid role' });
            return;
        }
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Store previous role for audit log
        const previousRole = user.role;
        // Update role
        user.role = role;
        await user.save();
        // Log the role change
        await (0, auditLogger_1.logAuditEvent)({
            action: auditLog_model_1.AuditAction.ROLE_UPDATED,
            performedBy: req.user.id,
            performedOn: userId,
            previousValue: { role: previousRole },
            newValue: { role },
            details: `Admin updated user role from ${previousRole} to ${role}`,
            req
        });
        res.status(200).json({
            message: 'User role updated successfully',
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateUserRole = updateUserRole;
// Admin: Delete user
const deleteUser = async (req, res) => {
    var _a;
    try {
        // Only admin can delete users
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== user_model_1.UserRole.ADMIN) {
            res.status(403).json({ message: 'Not authorized to delete users' });
            return;
        }
        const userId = req.params.id;
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Store user data for audit log before deletion
        const userData = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        };
        await user_model_1.default.findByIdAndDelete(userId);
        // Log the user deletion
        await (0, auditLogger_1.logAuditEvent)({
            action: auditLog_model_1.AuditAction.USER_DELETED,
            performedBy: req.user.id,
            performedOn: userId,
            previousValue: userData,
            details: `Admin deleted user: ${user.firstName} ${user.lastName} (${user.email})`,
            req
        });
        // Remove profile photo if exists
        if (user.profilePhoto) {
            const photoPath = path_1.default.join(__dirname, '../../uploads', path_1.default.basename(user.profilePhoto));
            if (fs_1.default.existsSync(photoPath)) {
                fs_1.default.unlinkSync(photoPath);
            }
        }
        res.status(200).json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteUser = deleteUser;
// Admin: Update doctor rating
const updateDoctorRating = async (req, res) => {
    var _a;
    try {
        // Only admin can update doctor ratings directly
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== user_model_1.UserRole.ADMIN) {
            res.status(403).json({ message: 'Not authorized to update doctor ratings' });
            return;
        }
        const userId = req.params.id;
        const { rating } = req.body;
        // Validate rating
        if (rating < 0 || rating > 5) {
            res.status(400).json({ message: 'Rating must be between 0 and 5' });
            return;
        }
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Check if user is a doctor
        if (user.role !== user_model_1.UserRole.DOCTOR) {
            res.status(400).json({ message: 'Rating can only be set for doctors' });
            return;
        }
        // Store previous rating for audit log
        const previousRating = user.rating;
        // Update rating
        user.rating = rating;
        // If this is the first rating, set ratingCount to 1
        if (!user.ratingCount) {
            user.ratingCount = 1;
        }
        await user.save();
        // Log the rating change for audit purposes
        await (0, auditLogger_1.logAuditEvent)({
            action: auditLog_model_1.AuditAction.DOCTOR_RATING_UPDATED,
            performedBy: req.user.id,
            performedOn: userId,
            previousValue: { rating: previousRating },
            newValue: { rating },
            details: `Admin updated doctor rating from ${previousRating || 0} to ${rating}`,
            req
        });
        console.log(`Admin ${req.user.id} updated doctor ${userId} rating to ${rating}`);
        res.status(200).json({
            message: 'Doctor rating updated successfully',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                rating: user.rating,
                ratingCount: user.ratingCount
            },
        });
    }
    catch (error) {
        console.error('Update doctor rating error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateDoctorRating = updateDoctorRating;
/**
 * Get doctor/nurse public profile data
 * This endpoint allows public access to healthcare provider profiles based on their visibility settings
 *
 * @route GET /api/users/providers/:id/public
 * @access Public
 */
const getProviderPublicProfile = async (req, res) => {
    try {
        const providerId = req.params.id;
        if (!providerId) {
            res.status(400).json({ message: 'Provider ID is required' });
            return;
        }
        const provider = await user_model_1.default.findById(providerId);
        if (!provider) {
            res.status(404).json({ message: 'Provider not found' });
            return;
        }
        // Only doctors and nurses have public profiles
        if (provider.role !== user_model_1.UserRole.DOCTOR && provider.role !== user_model_1.UserRole.NURSE) {
            res.status(400).json({ message: 'This user is not a healthcare provider' });
            return;
        }
        // Create public profile based on visibility settings
        const visibilitySettings = provider.visibilitySettings || {
            phone: false,
            email: false,
            department: true,
            specialization: true,
            licenseNumber: false,
            bio: true,
            education: true,
            experience: true
        };
        const publicProfile = {
            id: provider._id,
            firstName: provider.firstName,
            lastName: provider.lastName,
            role: provider.role,
            profilePhoto: provider.profilePhoto,
            // Only include fields that are marked as visible
            ...(visibilitySettings.email ? { email: provider.email } : {}),
            ...(visibilitySettings.phone ? { phone: provider.phone } : {}),
            ...(visibilitySettings.department ? { department: provider.department } : {}),
            ...(visibilitySettings.specialization ? { specialization: provider.specialization } : {}),
            ...(visibilitySettings.licenseNumber ? { licenseNumber: provider.licenseNumber } : {}),
            // Professional profile fields
            ...(!provider.professionalProfile ? {} : {
                professionalProfile: {
                    ...(visibilitySettings.bio ? { bio: provider.professionalProfile.bio } : {}),
                    ...(visibilitySettings.education ? { education: provider.professionalProfile.education } : {}),
                    ...(visibilitySettings.experience ? { experience: provider.professionalProfile.experience } : {}),
                    // Doctor-specific fields
                    ...(provider.role === user_model_1.UserRole.DOCTOR ? {
                        availability: provider.professionalProfile.availability,
                        consultationFee: provider.professionalProfile.consultationFee,
                        acceptingNewPatients: provider.professionalProfile.acceptingNewPatients
                    } : {})
                }
            }),
            // Include rating information which is always public for healthcare providers
            rating: provider.rating,
            ratingCount: provider.ratingCount,
        };
        res.status(200).json({ provider: publicProfile });
    }
    catch (error) {
        console.error('Get provider public profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getProviderPublicProfile = getProviderPublicProfile;
