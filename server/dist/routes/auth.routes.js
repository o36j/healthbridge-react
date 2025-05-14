"use strict";
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
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authController = __importStar(require("../controllers/auth.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const auth_validation_1 = require("../validations/auth.validation");
const router = express_1.default.Router();
/**
 * Rate limiting configuration specific to authentication routes
 * More restrictive than general API rate limits to prevent brute force attacks
 */
const authLimiter = (0, express_rate_limit_1.default)({
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
router.post('/register', authLimiter, (req, res, next) => {
    // Try to authenticate but continue even if it fails
    const token = req.cookies.token;
    if (token) {
        (0, auth_middleware_1.authenticate)(req, res, (err) => {
            // Continue to next middleware regardless of authentication result
            next();
        });
    }
    else {
        // No token, continue as unauthenticated user
        next();
    }
}, upload_middleware_1.uploadProfilePhoto, (0, validate_middleware_1.validateRequest)(auth_validation_1.registerSchema), authController.register);
/**
 * POST /api/auth/login
 * Authenticate a user and issue JWT token
 * Validates login credentials using the login schema
 */
router.post('/login', authLimiter, (0, validate_middleware_1.validateRequest)(auth_validation_1.loginSchema), authController.login);
/**
 * POST /api/auth/refresh-token
 * Issue a new JWT token using refresh token
 * Extends user session without requiring re-login
 */
router.post('/refresh-token', authLimiter, (0, validate_middleware_1.validateRequest)(auth_validation_1.refreshTokenSchema), authController.refreshToken);
/**
 * POST /api/auth/logout
 * End user session by clearing cookies
 */
router.post('/logout', authLimiter, authController.logout);
/**
 * Protected routes (authentication required)
 */
/**
 * GET /api/auth/me
 * Get current authenticated user's information
 * Requires valid JWT token
 */
router.get('/me', auth_middleware_1.authenticate, authController.getMe);
exports.default = router;
