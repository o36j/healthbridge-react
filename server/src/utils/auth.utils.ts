/**
 * Authentication Utilities
 * 
 * This module provides utility functions for JWT token generation and verification,
 * used for implementing the authentication system in the application.
 * 
 * It includes functions for:
 * - Generating short-lived access tokens
 * - Generating longer-lived refresh tokens
 * - Verifying refresh tokens for token renewal
 */

import jwt from 'jsonwebtoken';
import { UserRole } from '../models/user.model';

/**
 * Structure of the JWT token payload
 * Contains essential user information for authentication and authorization
 */
interface TokenPayload {
  id: string;      // User's MongoDB ID
  email: string;   // User's email address
  role: UserRole;  // User's role for authorization
}

/**
 * Generates a JWT access token
 * 
 * Creates a short-lived token for API authentication
 * 
 * @param payload - User data to include in the token
 * @returns Signed JWT token string
 */
export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } as jwt.SignOptions
  );
};

/**
 * Generates a JWT refresh token
 * 
 * Creates a longer-lived token for obtaining new access tokens
 * without requiring the user to log in again
 * 
 * @param payload - User data to include in the token
 * @returns Signed JWT refresh token string
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
};

/**
 * Verifies a refresh token
 * 
 * Validates the refresh token and returns the decoded payload
 * Throws an error if the token is invalid or expired
 * 
 * @param token - Refresh token to verify
 * @returns Decoded token payload
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as TokenPayload;
};

/**
 * Debug utility to log cookie operations
 * 
 * @param req - Express request object
 * @param operation - The operation being performed (e.g., "set", "clear")
 * @param cookieName - The name of the cookie
 */
export const logCookieOperation = (req: any, operation: string, cookieName: string): void => {
  console.log(`[Cookie Debug] ${operation} cookie: ${cookieName}`);
  console.log(`[Cookie Debug] User: ${req.user?.email || 'Not authenticated'}, Role: ${req.user?.role || 'N/A'}`);
  console.log(`[Cookie Debug] Headers:`, {
    host: req.get('host'),
    origin: req.get('origin'),
    referer: req.get('referer')
  });
  console.log(`[Cookie Debug] Cookies current:`, req.cookies);
}; 