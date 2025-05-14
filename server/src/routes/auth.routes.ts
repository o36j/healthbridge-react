/**
 * Authentication Routes
 * 
 * This module defines API endpoints for user authentication operations:
 * - User registration with profile photo upload
 * - User login with JWT token generation
 * - Token refresh for maintaining authentication
 * - Logout functionality
 * - Retrieving authenticated user information
 * 
 * All authentication routes include rate limiting to prevent abuse.
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { uploadProfilePhoto } from '../middlewares/upload.middleware';
import { loginSchema, registerSchema, refreshTokenSchema } from '../validations/auth.validation';

const router = express.Router();

/**
 * Rate limiting configuration specific to authentication routes
 * More restrictive than general API rate limits to prevent brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later'
});

/**
 * Public routes (no authentication required)
 */

/**
 * POST /api/auth/register
 * Register a new user with optional profile photo
 * Validates request data using the register schema
 * Uses optional authentication to detect if an admin is creating the user
 */
router.post('/register', 
  authLimiter,
  (req, res, next) => {
    // Try to authenticate but continue even if it fails
    const token = req.cookies.token;
    if (token) {
      authenticate(req, res, (err) => {
        // Continue to next middleware regardless of authentication result
        next();
      });
    } else {
      // No token, continue as unauthenticated user
      next();
    }
  },
  uploadProfilePhoto,
  validateRequest(registerSchema),
  authController.register
);

/**
 * POST /api/auth/login
 * Authenticate a user and issue JWT token
 * Validates login credentials using the login schema
 */
router.post('/login', 
  authLimiter,
  validateRequest(loginSchema),
  authController.login
);

/**
 * POST /api/auth/refresh-token
 * Issue a new JWT token using refresh token
 * Extends user session without requiring re-login
 */
router.post('/refresh-token', 
  authLimiter,
  validateRequest(refreshTokenSchema),
  authController.refreshToken
);

/**
 * POST /api/auth/logout
 * End user session by clearing cookies
 */
router.post('/logout', 
  authLimiter,
  authController.logout
);

/**
 * Protected routes (authentication required)
 */

/**
 * GET /api/auth/me
 * Get current authenticated user's information
 * Requires valid JWT token
 */
router.get('/me', 
  authenticate,
  authController.getMe
);

export default router; 