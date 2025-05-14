import express from 'express';
import {
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
  changePassword,
  updateUserRole,
  deleteUser,
  getPublicDoctors,
  updateDoctorRating,
  getMedicalStaffPatients,
  getProviderPublicProfile
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { uploadProfilePhoto as uploadMiddleware } from '../middlewares/upload.middleware';
import User, { UserRole } from '../models/user.model';
import * as userPreferencesController from '../controllers/userPreferences.controller';
import * as userActivityController from '../controllers/userActivity.controller';

const router = express.Router();

// Public routes - these don't require authentication
router.get('/public/doctors', getPublicDoctors);
router.get('/providers/:id/public', getProviderPublicProfile);
router.get('/doctors', getPublicDoctors);
router.get('/doctors/:id', getProviderPublicProfile);

// Apply authentication middleware to all routes except the upload-photo route and public routes
router.use((req, res, next) => {
  if (req.path.includes('/upload-photo/') || req.path.includes('/public/') || 
      req.path === '/doctors' || req.path.startsWith('/doctors/')) {
    return next();
  }
  authenticate(req, res, next);
});

// Admin-only routes
router.get('/', authorize([UserRole.ADMIN]), getAllUsers);
router.put('/role/:id', authorize([UserRole.ADMIN]), updateUserRole);
router.delete('/:id', authorize([UserRole.ADMIN]), deleteUser);
router.put('/rating/:id', authorize([UserRole.ADMIN]), updateDoctorRating);

// Medical staff routes for patient access
router.get('/doctor/patients', authorize([UserRole.DOCTOR]), getMedicalStaffPatients);
router.get('/nurse/patients', authorize([UserRole.NURSE]), getMedicalStaffPatients);
router.get('/patients/list', authorize([UserRole.DOCTOR, UserRole.NURSE]), getMedicalStaffPatients);

// Upload profile photo
router.post('/upload-photo/:id', uploadMiddleware, uploadProfilePhoto);

// Doctor rating
router.put('/doctors/:id/rating', authenticate, updateDoctorRating);

// User-specific routes
router.get('/:id', authenticate, getUserProfile);
router.put('/:id', authenticate, updateUserProfile);
router.put('/:id/password', authenticate, changePassword);
router.put('/change-password/:id', authenticate, changePassword);

// User preferences
router.get('/:id/preferences', authenticate, userPreferencesController.getUserPreferences);
router.put('/:id/preferences', authenticate, userPreferencesController.updateUserPreferences);

// User activity history
router.get('/:id/activity', authenticate, userActivityController.getUserActivity);

// Security settings
router.put('/:id/security-settings', authenticate, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Only allow users to update their own security settings, unless they're an admin
    if (req.user?.id !== userId && req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Not authorized to update these settings' });
      return;
    }
    
    const { loginNotifications, sessionTimeout } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Create preferences object if it doesn't exist
    if (!user.preferences) {
      user.preferences = {};
    }
    
    // Create or update security settings object
    if (!user.preferences.security) {
      user.preferences.security = {
        loginNotifications: true,
        sessionTimeout: '60'
      };
    }
    
    // Update security settings
    if (loginNotifications !== undefined) {
      user.preferences.security.loginNotifications = loginNotifications;
    }
    
    if (sessionTimeout) {
      user.preferences.security.sessionTimeout = sessionTimeout;
    }
    
    await user.save();
    
    res.status(200).json({ message: 'Security settings updated successfully' });
  } catch (error) {
    console.error('Update security settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 