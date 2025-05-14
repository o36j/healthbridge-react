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

import { Request, Response } from 'express';
import User, { UserRole } from '../models/user.model';
import { generateToken, generateRefreshToken, verifyRefreshToken, logCookieOperation } from '../utils/auth.utils';
import { Types } from 'mongoose';

/**
 * Register a new user
 * 
 * Creates a new user account with the provided information,
 * handles profile photo upload, and generates authentication tokens.
 * 
 * @param req - Express request object containing user registration data
 * @param res - Express response object
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Register route called');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request file:', req.file);
    
    const { email, password, firstName, lastName, role } = req.body;
    
    console.log('Extracted data:', { email, firstName, lastName, role });
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists with email:', email);
      res.status(400).json({ message: 'User already exists with this email' });
      return;
    }
    
    // Validate role (don't allow admin registration directly)
    if (role === UserRole.ADMIN) {
      console.log('Admin registration attempt rejected');
      res.status(403).json({ message: 'Admin registration not allowed' });
      return;
    }
    
    // Create new user with profile photo if uploaded
    const userData: any = {
      email,
      password,
      firstName,
      lastName,
      role: role || UserRole.PATIENT,
    };
    
    // Handle profile photo if it was uploaded
    if (req.file) {
      // Store the path relative to the server
      userData.profilePhoto = `/uploads/${req.file.filename}`;
      console.log('Profile photo path:', userData.profilePhoto);
    }
    
    // Add optional fields if present
    if (req.body.department) userData.department = req.body.department;
    if (req.body.specialization) userData.specialization = req.body.specialization;
    if (req.body.location) userData.location = req.body.location;
    
    // Handle professional profile data for doctors
    if (role === UserRole.DOCTOR) {
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
        } catch (e) {
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
        } catch (e) {
          // If JSON parsing fails, use the string as is
          userData.professionalProfile.availability = req.body.availability;
        }
      }
    }
    
    const user = new User(userData);
    
    await user.save();
    
    // Check if current user is an admin creating another user
    const isAdminCreatingUser = req.user && req.user.role === UserRole.ADMIN;
    
    // Only set auth cookies if this is NOT an admin creating a user
    if (!isAdminCreatingUser) {
      // Generate tokens
      const accessToken = generateToken({
        id: (user._id as Types.ObjectId).toString(),
        email: user.email,
        role: user.role,
      });
      
      const refreshToken = generateRefreshToken({
        id: (user._id as Types.ObjectId).toString(),
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
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Authenticate a user
 * 
 * Verifies user credentials, generates authentication tokens,
 * and returns user information on successful login.
 * 
 * @param req - Express request object containing login credentials
 * @param res - Express response object
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
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
    const accessToken = generateToken({
      id: (user._id as Types.ObjectId).toString(),
      email: user.email,
      role: user.role,
    });
    
    const refreshToken = generateRefreshToken({
      id: (user._id as Types.ObjectId).toString(),
      email: user.email,
      role: user.role,
    });
    
    // Special logging for admin users
    const isAdmin = user.role === UserRole.ADMIN;
    if (isAdmin) {
      console.log('Admin user login:', user.email);
      logCookieOperation(req, 'before_login_admin', 'all');
    }
    
    // Get the domain from request for setting cookies
    const domain = req.get('host')?.split(':')[0] || undefined;
    
    // Set cookies with explicit cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      domain: domain !== 'localhost' ? domain : undefined,
      sameSite: 'lax' as const
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
      logCookieOperation(req, 'after_login_admin', 'all');
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Refresh authentication token
 * 
 * Uses the refresh token to generate a new access token,
 * extending the user's session without requiring re-login.
 * 
 * @param req - Express request object containing refresh token
 * @param res - Express response object
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token not found' });
      return;
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }
    
    // Generate new access token
    const accessToken = generateToken({
      id: (user._id as Types.ObjectId).toString(),
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
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

/**
 * Log out user
 * 
 * Clears authentication cookies to end the user's session.
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export const logout = (req: Request, res: Response): void => {
  try {
    console.log('Processing logout request for user:', req.user?.email, 'Role:', req.user?.role);
    logCookieOperation(req, 'before_logout', 'all');
    
    // Get the domain from request for setting cookies
    const domain = req.get('host')?.split(':')[0] || undefined;
    
    // Clear cookies with various option combinations to ensure they're removed
    res.cookie('token', '', { 
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      domain: domain !== 'localhost' ? domain : undefined
    });
    logCookieOperation(req, 'clear', 'token');
    
    res.cookie('refreshToken', '', { 
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      domain: domain !== 'localhost' ? domain : undefined
    });
    logCookieOperation(req, 'clear', 'refreshToken');
    
    // Also try with different settings just to be sure
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    
    console.log('Logout successful, cookies cleared');
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ message: 'An error occurred during logout' });
  }
};

/**
 * Get authenticated user information
 * 
 * Retrieves the current user's profile information based on their
 * authentication token. Requires the user to be authenticated.
 * 
 * @param req - Express request object containing authenticated user
 * @param res - Express response object
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    const user = await User.findById(userId).select('-password');
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
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 