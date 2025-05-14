/**
 * Authentication and Authorization Middleware
 * 
 * This module provides middleware functions for:
 * 1. Authenticating users via JWT tokens from cookies or Authorization header
 * 2. Authorizing users based on their roles
 * 
 * These middleware functions can be applied to routes to protect them
 * from unauthorized access.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserRole, IUser } from '../models/user.model';
import { toObjectId } from '../utils/mongoose.utils';
import mongoose from 'mongoose';
import createLogger from '../utils/logger';

const logger = createLogger('Auth');

/**
 * Type extension for Express Request to include user information
 * after successful authentication
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        firstName?: string;
        lastName?: string;
      };
    }
  }
}

interface JwtPayload {
  userId: string;
  id?: string;
  email?: string;
  role?: UserRole;
}

/**
 * Authentication middleware
 * 
 * Verifies the JWT token from cookies or Authorization header and attaches 
 * decoded user information to the request object if authentication is successful
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const path = req.originalUrl;
    logger.debug(`Authentication check for path: ${path}`);
    
    // Try to get token from Authorization header
    let token = req.header('Authorization')?.replace('Bearer ', '');
    
    // If not in header, try to get from cookie
    if (!token) {
      token = req.cookies.token;
      logger.debug(`Using token from cookie: ${token ? 'Token found' : 'No token'}`);
    } else {
      logger.debug('Using token from Authorization header');
    }
    
    if (!token) {
      logger.debug('No authentication token found');
      res.status(401).json({ message: 'Authentication required. Please login.' });
      return;
    }
    
    // Verify token using the secret key from environment variables
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    
    // If the token contains complete user info, use it directly
    if (decoded.id && decoded.email && decoded.role) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
      
      logger.debug(`User authenticated from token: ${decoded.email}, role: ${decoded.role}`);
      next();
      return;
    }
    
    // Otherwise, fetch the user from the database
    if (decoded.userId) {
      try {
        const user = await User.findById(decoded.userId).exec();
        
        if (!user) {
          logger.warn(`User not found with ID: ${decoded.userId}`);
          res.status(401).json({ message: 'User not found' });
          return;
        }
        
        // Set user information on the request
        req.user = {
          id: user.id, // Using the id getter which returns string
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        };
        
        logger.debug(`User authenticated from database: ${user.email}, role: ${user.role}`);
        next();
      } catch (err) {
        logger.error('Error fetching user from database', err);
        res.status(500).json({ message: 'Server error while authenticating user' });
      }
      return;
    }
    
    // If we get here, the token doesn't have the right format
    logger.warn('Invalid token format received');
    res.status(401).json({ message: 'Invalid token format' });
    
  } catch (error) {
    logger.error('Authentication error', error);
    res.status(401).json({ message: 'Invalid or expired token. Please login again.' });
  }
};

/**
 * Authorization middleware factory
 * 
 * Creates a middleware that checks if the authenticated user has one of the
 * specified roles required to access a resource
 * 
 * @param roles - Array of user roles that are allowed to access the resource
 * @returns Middleware function that checks user's role against allowed roles
 */
export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Ensure user is authenticated
    if (!req.user) {
      logger.warn(`Authorization failed: No authenticated user for path ${req.originalUrl}`);
      res.status(401).json({ message: 'Authentication required. Please login.' });
      return;
    }
    
    // Check if user's role is in the list of authorized roles
    if (!roles.includes(req.user.role)) {
      logger.warn(`Access denied: User ${req.user.email} with role ${req.user.role} attempted to access ${req.originalUrl}`);
      res.status(403).json({ message: 'You do not have permission to access this resource.' });
      return;
    }
    
    // User is authorized to access the resource
    logger.debug(`User ${req.user.email} with role ${req.user.role} authorized for ${req.originalUrl}`);
    next();
  };
}; 