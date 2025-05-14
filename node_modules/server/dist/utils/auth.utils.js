"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logCookieOperation = exports.verifyRefreshToken = exports.generateRefreshToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Generates a JWT access token
 *
 * Creates a short-lived token for API authentication
 *
 * @param payload - User data to include in the token
 * @returns Signed JWT token string
 */
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
};
exports.generateToken = generateToken;
/**
 * Generates a JWT refresh token
 *
 * Creates a longer-lived token for obtaining new access tokens
 * without requiring the user to log in again
 *
 * @param payload - User data to include in the token
 * @returns Signed JWT refresh token string
 */
const generateRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Verifies a refresh token
 *
 * Validates the refresh token and returns the decoded payload
 * Throws an error if the token is invalid or expired
 *
 * @param token - Refresh token to verify
 * @returns Decoded token payload
 */
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
};
exports.verifyRefreshToken = verifyRefreshToken;
/**
 * Debug utility to log cookie operations
 *
 * @param req - Express request object
 * @param operation - The operation being performed (e.g., "set", "clear")
 * @param cookieName - The name of the cookie
 */
const logCookieOperation = (req, operation, cookieName) => {
    var _a, _b;
    console.log(`[Cookie Debug] ${operation} cookie: ${cookieName}`);
    console.log(`[Cookie Debug] User: ${((_a = req.user) === null || _a === void 0 ? void 0 : _a.email) || 'Not authenticated'}, Role: ${((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) || 'N/A'}`);
    console.log(`[Cookie Debug] Headers:`, {
        host: req.get('host'),
        origin: req.get('origin'),
        referer: req.get('referer')
    });
    console.log(`[Cookie Debug] Cookies current:`, req.cookies);
};
exports.logCookieOperation = logCookieOperation;
