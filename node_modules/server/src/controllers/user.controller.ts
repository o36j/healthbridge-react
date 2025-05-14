import { Request, Response } from 'express';
import User, { UserRole } from '../models/user.model';
import fs from 'fs';
import path from 'path';
import { logAuditEvent } from '../utils/auditLogger';
import { AuditAction } from '../models/auditLog.model';
import createLogger from '../utils/logger';

const logger = createLogger('UserController');

// Get all doctors for public access
export const getPublicDoctors = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('Fetching public doctors data', { route: req.originalUrl });
    const { search, page = '1', limit = '10' } = req.query;
    
    // Parse pagination parameters
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Start with a less restrictive query to find any doctors
    let query: any = { role: UserRole.DOCTOR };
    
    // Get total user/doctor counts for diagnostics
    const totalUsers = await User.countDocuments({});
    const totalDoctors = await User.countDocuments({ role: UserRole.DOCTOR });
    
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
    const totalFilteredDoctors = await User.countDocuments(query);
    
    // Apply pagination to query
    const doctors = await User.find(query)
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
  } catch (error) {
    logger.error('Failed to get public doctors', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user profile
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Only allow users to view their own profile, unless they're medical staff or admin
    if (
      req.user?.id !== userId &&
      ![UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE].includes(req.user?.role as UserRole)
    ) {
      res.status(403).json({ message: 'Not authorized to view this profile' });
      return;
    }
    
    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
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
    if (req.user?.id !== userId && req.user?.role !== UserRole.ADMIN) {
      console.error('Authorization failure - User can only update their own profile');
      console.error('Request user ID:', req.user?.id);
      console.error('Target user ID:', userId);
      console.error('User role:', req.user?.role);
      res.status(403).json({ 
        message: 'Not authorized to update this profile',
        detail: 'You can only update your own profile unless you are an administrator' 
      });
      return;
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      console.error('User not found with ID:', userId);
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    console.log('Found user:', user._id, user.email);
    
    // Fields to update (excluding password and role which have separate endpoints)
    const {
      email,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      address,
      department,
      specialization,
      licenseNumber,
      medicalRecordNumber,
      emergencyContact,
      bloodType,
      allergies,
      professionalProfile,
      visibilitySettings
    } = req.body;
    
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
      const existingUserWithEmail = await User.findOne({ email });
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
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (gender !== undefined) user.gender = gender;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    
    // Update role-specific fields
    if (user.role === UserRole.DOCTOR || user.role === UserRole.NURSE) {
      if (department !== undefined) user.department = department;
      if (specialization !== undefined) user.specialization = specialization;
      if (licenseNumber !== undefined) user.licenseNumber = licenseNumber;
      
      // Update professional profile if provided
      if (professionalProfile) {
        if (!user.professionalProfile) {
          user.professionalProfile = {};
        }
        
        if (professionalProfile.bio !== undefined) user.professionalProfile.bio = professionalProfile.bio;
        if (professionalProfile.education !== undefined) user.professionalProfile.education = professionalProfile.education;
        if (professionalProfile.experience !== undefined) user.professionalProfile.experience = professionalProfile.experience;
        
        // Doctor-specific fields
        if (user.role === UserRole.DOCTOR) {
          if (professionalProfile.availability !== undefined) user.professionalProfile.availability = professionalProfile.availability;
          if (professionalProfile.consultationFee !== undefined) user.professionalProfile.consultationFee = professionalProfile.consultationFee;
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
        
        if (visibilitySettings.phone !== undefined) user.visibilitySettings.phone = visibilitySettings.phone;
        if (visibilitySettings.email !== undefined) user.visibilitySettings.email = visibilitySettings.email;
        if (visibilitySettings.department !== undefined) user.visibilitySettings.department = visibilitySettings.department;
        if (visibilitySettings.specialization !== undefined) user.visibilitySettings.specialization = visibilitySettings.specialization;
        if (visibilitySettings.licenseNumber !== undefined) user.visibilitySettings.licenseNumber = visibilitySettings.licenseNumber;
        if (visibilitySettings.bio !== undefined) user.visibilitySettings.bio = visibilitySettings.bio;
        if (visibilitySettings.education !== undefined) user.visibilitySettings.education = visibilitySettings.education;
        if (visibilitySettings.experience !== undefined) user.visibilitySettings.experience = visibilitySettings.experience;
      }
    }
    
    if (user.role === UserRole.PATIENT) {
      if (medicalRecordNumber !== undefined) user.medicalRecordNumber = medicalRecordNumber;
      if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;
      if (bloodType !== undefined) user.bloodType = bloodType;
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
      ...(user.role === UserRole.PATIENT 
        ? { 
            bloodType: user.bloodType,
            allergies: user.allergies,
            emergencyContact: user.emergencyContact,
          } 
        : {}),
      ...(user.role === UserRole.DOCTOR || user.role === UserRole.NURSE 
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
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload profile photo
export const uploadProfilePhoto = async (req: Request, res: Response): Promise<void> => {
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
    
    const user = await User.findById(userId);
    
    if (!user) {
      // Remove the uploaded file if user not found
      fs.unlinkSync(req.file.path);
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Remove old profile photo if exists
    if (user.profilePhoto) {
      const oldPhotoPath = path.join(__dirname, '../../uploads', path.basename(user.profilePhoto));
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
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
  } catch (error) {
    console.error('Upload profile photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    
    // Only allow users to change their own password, unless they're an admin
    if (req.user?.id !== userId && req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Not authorized to change this password' });
      return;
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters' });
      return;
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Admin can change password without knowing current password
    if (req.user?.role !== UserRole.ADMIN) {
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
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Get all users
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admin can get all users
    if (req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Not authorized to access this resource' });
      return;
    }
    
    const { role, search } = req.query;
    
    let query: any = {};
    
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
    
    const users = await User.find(query).select('-password');
    
    res.status(200).json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Medical Staff: Get patients for doctors and nurses
export const getMedicalStaffPatients = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only medical staff (doctors and nurses) can get patient data
    if (req.user?.role !== UserRole.DOCTOR && req.user?.role !== UserRole.NURSE) {
      res.status(403).json({ message: 'Not authorized to access patient data' });
      return;
    }
    
    const { search } = req.query;
    
    // Always filter for patient role only
    let query: any = { role: UserRole.PATIENT };
    
    // Search by name or email if provided
    if (search) {
      const searchRegex = new RegExp(search.toString(), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ];
    }
    
    const patients = await User.find(query).select('-password');
    
    res.status(200).json({ users: patients });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Update user role
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admin can update user roles
    if (req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Not authorized to update user roles' });
      return;
    }
    
    const userId = req.params.id;
    const { role } = req.body;
    
    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }
    
    const user = await User.findById(userId);
    
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
    await logAuditEvent({
      action: AuditAction.ROLE_UPDATED,
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
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Delete user
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admin can delete users
    if (req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Not authorized to delete users' });
      return;
    }
    
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    
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
    
    await User.findByIdAndDelete(userId);
    
    // Log the user deletion
    await logAuditEvent({
      action: AuditAction.USER_DELETED,
      performedBy: req.user.id,
      performedOn: userId,
      previousValue: userData,
      details: `Admin deleted user: ${user.firstName} ${user.lastName} (${user.email})`,
      req
    });
    
    // Remove profile photo if exists
    if (user.profilePhoto) {
      const photoPath = path.join(__dirname, '../../uploads', path.basename(user.profilePhoto));
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Update doctor rating
export const updateDoctorRating = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admin can update doctor ratings directly
    if (req.user?.role !== UserRole.ADMIN) {
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
    
    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Check if user is a doctor
    if (user.role !== UserRole.DOCTOR) {
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
    await logAuditEvent({
      action: AuditAction.DOCTOR_RATING_UPDATED,
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
  } catch (error) {
    console.error('Update doctor rating error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get doctor/nurse public profile data
 * This endpoint allows public access to healthcare provider profiles based on their visibility settings
 * 
 * @route GET /api/users/providers/:id/public
 * @access Public
 */
export const getProviderPublicProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const providerId = req.params.id;
    
    if (!providerId) {
      res.status(400).json({ message: 'Provider ID is required' });
      return;
    }
    
    const provider = await User.findById(providerId);
    
    if (!provider) {
      res.status(404).json({ message: 'Provider not found' });
      return;
    }
    
    // Only doctors and nurses have public profiles
    if (provider.role !== UserRole.DOCTOR && provider.role !== UserRole.NURSE) {
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
          ...(provider.role === UserRole.DOCTOR ? {
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
  } catch (error) {
    console.error('Get provider public profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 