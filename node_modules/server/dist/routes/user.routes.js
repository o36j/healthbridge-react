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
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const user_model_1 = __importStar(require("../models/user.model"));
const userPreferencesController = __importStar(require("../controllers/userPreferences.controller"));
const userActivityController = __importStar(require("../controllers/userActivity.controller"));
const router = express_1.default.Router();
// Public routes - these don't require authentication
router.get('/public/doctors', user_controller_1.getPublicDoctors);
router.get('/providers/:id/public', user_controller_1.getProviderPublicProfile);
router.get('/doctors', user_controller_1.getPublicDoctors);
router.get('/doctors/:id', user_controller_1.getProviderPublicProfile);
// Apply authentication middleware to all routes except the upload-photo route and public routes
router.use((req, res, next) => {
    if (req.path.includes('/upload-photo/') || req.path.includes('/public/') ||
        req.path === '/doctors' || req.path.startsWith('/doctors/')) {
        return next();
    }
    (0, auth_middleware_1.authenticate)(req, res, next);
});
// Admin-only routes
router.get('/', (0, auth_middleware_1.authorize)([user_model_1.UserRole.ADMIN]), user_controller_1.getAllUsers);
router.put('/role/:id', (0, auth_middleware_1.authorize)([user_model_1.UserRole.ADMIN]), user_controller_1.updateUserRole);
router.delete('/:id', (0, auth_middleware_1.authorize)([user_model_1.UserRole.ADMIN]), user_controller_1.deleteUser);
router.put('/rating/:id', (0, auth_middleware_1.authorize)([user_model_1.UserRole.ADMIN]), user_controller_1.updateDoctorRating);
// Medical staff routes for patient access
router.get('/doctor/patients', (0, auth_middleware_1.authorize)([user_model_1.UserRole.DOCTOR]), user_controller_1.getMedicalStaffPatients);
router.get('/nurse/patients', (0, auth_middleware_1.authorize)([user_model_1.UserRole.NURSE]), user_controller_1.getMedicalStaffPatients);
router.get('/patients/list', (0, auth_middleware_1.authorize)([user_model_1.UserRole.DOCTOR, user_model_1.UserRole.NURSE]), user_controller_1.getMedicalStaffPatients);
// Upload profile photo
router.post('/upload-photo/:id', upload_middleware_1.uploadProfilePhoto, user_controller_1.uploadProfilePhoto);
// Doctor rating
router.put('/doctors/:id/rating', auth_middleware_1.authenticate, user_controller_1.updateDoctorRating);
// User-specific routes
router.get('/:id', auth_middleware_1.authenticate, user_controller_1.getUserProfile);
router.put('/:id', auth_middleware_1.authenticate, user_controller_1.updateUserProfile);
router.put('/:id/password', auth_middleware_1.authenticate, user_controller_1.changePassword);
router.put('/change-password/:id', auth_middleware_1.authenticate, user_controller_1.changePassword);
// User preferences
router.get('/:id/preferences', auth_middleware_1.authenticate, userPreferencesController.getUserPreferences);
router.put('/:id/preferences', auth_middleware_1.authenticate, userPreferencesController.updateUserPreferences);
// User activity history
router.get('/:id/activity', auth_middleware_1.authenticate, userActivityController.getUserActivity);
// Security settings
router.put('/:id/security-settings', auth_middleware_1.authenticate, async (req, res) => {
    var _a, _b;
    try {
        const userId = req.params.id;
        // Only allow users to update their own security settings, unless they're an admin
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== userId && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== user_model_1.UserRole.ADMIN) {
            res.status(403).json({ message: 'Not authorized to update these settings' });
            return;
        }
        const { loginNotifications, sessionTimeout } = req.body;
        const user = await user_model_1.default.findById(userId);
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
    }
    catch (error) {
        console.error('Update security settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
