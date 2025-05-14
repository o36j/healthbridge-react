"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = exports.deleteNotification = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getUserNotifications = void 0;
const notification_model_1 = __importDefault(require("../models/notification.model"));
const mongoose_utils_1 = require("../utils/mongoose.utils");
// Get notifications for the current user
const getUserNotifications = async (req, res) => {
    var _a, _b;
    try {
        const { limit = 20, skip = 0, unreadOnly = false } = req.query;
        const query = { user: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id };
        // Filter by read status if requested
        if (unreadOnly === 'true') {
            query.read = false;
        }
        // Get total count for pagination
        const totalCount = await notification_model_1.default.countDocuments(query);
        // Get notifications
        const notifications = await notification_model_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(Number(skip))
            .limit(Number(limit));
        // Get unread count
        const unreadCount = await notification_model_1.default.countDocuments({
            user: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
            read: false
        });
        res.status(200).json({
            notifications,
            totalCount,
            unreadCount
        });
    }
    catch (error) {
        console.error('Get user notifications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserNotifications = getUserNotifications;
// Mark notification as read
const markNotificationAsRead = async (req, res) => {
    var _a;
    try {
        const { notificationId } = req.params;
        const notification = await notification_model_1.default.findById(notificationId);
        if (!notification) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }
        // Ensure the notification belongs to the current user
        if (notification.user.toString() !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            res.status(403).json({ message: 'Not authorized to update this notification' });
            return;
        }
        notification.read = true;
        await notification.save();
        res.status(200).json({
            message: 'Notification marked as read',
            notification
        });
    }
    catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
    var _a;
    try {
        await notification_model_1.default.updateMany({ user: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id, read: false }, { $set: { read: true } });
        res.status(200).json({
            message: 'All notifications marked as read'
        });
    }
    catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
// Delete a notification
const deleteNotification = async (req, res) => {
    var _a;
    try {
        const { notificationId } = req.params;
        const notification = await notification_model_1.default.findById(notificationId);
        if (!notification) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }
        // Ensure the notification belongs to the current user
        if (notification.user.toString() !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            res.status(403).json({ message: 'Not authorized to delete this notification' });
            return;
        }
        await notification.deleteOne();
        res.status(200).json({
            message: 'Notification deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteNotification = deleteNotification;
// Create a notification (internal use only, not exposed as API)
const createNotification = async (userId, title, message, type, relatedId, relatedModel) => {
    try {
        const notification = new notification_model_1.default({
            user: (0, mongoose_utils_1.toObjectId)(userId),
            title,
            message,
            type,
            relatedId: relatedId ? (0, mongoose_utils_1.toObjectId)(relatedId) : undefined,
            relatedModel: relatedModel || undefined
        });
        await notification.save();
        return notification;
    }
    catch (error) {
        console.error('Create notification error:', error);
        throw error;
    }
};
exports.createNotification = createNotification;
