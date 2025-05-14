"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserPreferences = exports.getUserPreferences = void 0;
const userPreferences_model_1 = __importDefault(require("../models/userPreferences.model"));
const auditLogger_1 = require("../utils/auditLogger");
const auditLog_model_1 = require("../models/auditLog.model");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Get user preferences
 *
 * @route GET /api/users/:id/preferences
 * @access Private - User can only access their own preferences unless they're an admin
 */
const getUserPreferences = async (req, res) => {
    var _a, _b;
    try {
        const userId = req.params.id;
        // Authorization check
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== userId && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'admin') {
            res.status(403).json({ message: 'Not authorized to access these preferences' });
            return;
        }
        // Find or create preferences
        let preferences = await userPreferences_model_1.default.findOne({ userId });
        if (!preferences) {
            // If no preferences found, return empty default preferences
            res.status(200).json({
                preferences: {
                    theme: 'light',
                    compactMode: false,
                    notifications: {
                        email: true,
                        sms: true,
                        browser: false
                    },
                    language: 'en',
                    dateFormat: 'mm/dd/yyyy',
                    timeFormat: '12'
                }
            });
            return;
        }
        res.status(200).json({ preferences });
    }
    catch (error) {
        console.error('Get user preferences error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserPreferences = getUserPreferences;
/**
 * Update user preferences
 *
 * @route PUT /api/users/:id/preferences
 * @access Private - User can only update their own preferences unless they're an admin
 */
const updateUserPreferences = async (req, res) => {
    var _a, _b;
    try {
        const userId = req.params.id;
        // Authorization check
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== userId && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'admin') {
            res.status(403).json({ message: 'Not authorized to update these preferences' });
            return;
        }
        const { theme, compactMode, notifications, language, dateFormat, timeFormat } = req.body;
        // Validate required fields
        if (!theme) {
            res.status(400).json({ message: 'Theme is required' });
            return;
        }
        // Find existing preferences or create new ones
        let preferences = await userPreferences_model_1.default.findOne({ userId });
        if (!preferences) {
            preferences = new userPreferences_model_1.default({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                theme,
                compactMode,
                notifications,
                language,
                dateFormat,
                timeFormat
            });
        }
        else {
            // Update existing preferences
            preferences.theme = theme;
            preferences.compactMode = compactMode !== undefined ? compactMode : preferences.compactMode;
            if (notifications) {
                preferences.notifications = {
                    email: notifications.email !== undefined ? notifications.email : preferences.notifications.email,
                    sms: notifications.sms !== undefined ? notifications.sms : preferences.notifications.sms,
                    browser: notifications.browser !== undefined ? notifications.browser : preferences.notifications.browser
                };
            }
            preferences.language = language || preferences.language;
            preferences.dateFormat = dateFormat || preferences.dateFormat;
            preferences.timeFormat = timeFormat || preferences.timeFormat;
        }
        // Save preferences
        await preferences.save();
        // Log audit event
        await (0, auditLogger_1.logAuditEvent)({
            action: auditLog_model_1.AuditAction.USER_UPDATED,
            performedBy: req.user.id,
            performedOn: userId,
            details: 'User preferences updated',
            req
        });
        res.status(200).json({
            message: 'Preferences updated successfully',
            preferences
        });
    }
    catch (error) {
        console.error('Update user preferences error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateUserPreferences = updateUserPreferences;
