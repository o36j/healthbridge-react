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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.getConversations = exports.getConversation = exports.sendMessage = void 0;
const message_model_1 = __importStar(require("../models/message.model"));
const user_model_1 = __importStar(require("../models/user.model"));
const notification_model_1 = __importStar(require("../models/notification.model"));
const mongoose_utils_1 = require("../utils/mongoose.utils");
// Send a new message
const sendMessage = async (req, res) => {
    var _a, _b;
    try {
        const { recipientId, content, appointmentId } = req.body;
        // Validate required fields
        if (!recipientId || !content) {
            res.status(400).json({ message: 'Recipient and content are required' });
            return;
        }
        // Verify recipient exists
        const recipient = await user_model_1.default.findById(recipientId);
        if (!recipient) {
            res.status(404).json({ message: 'Recipient not found' });
            return;
        }
        // Validate that messages can only be sent between doctors and patients
        const sender = await user_model_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (!sender) {
            res.status(404).json({ message: 'Sender not found' });
            return;
        }
        // Check if it's a doctor-patient interaction
        const isValidDoctorPatientInteraction = (sender.role === user_model_1.UserRole.DOCTOR && recipient.role === user_model_1.UserRole.PATIENT) ||
            (sender.role === user_model_1.UserRole.PATIENT && recipient.role === user_model_1.UserRole.DOCTOR);
        // Allow admin and nurse to message anyone
        const isMedicalStaff = [user_model_1.UserRole.ADMIN, user_model_1.UserRole.NURSE].includes(sender.role);
        if (!isValidDoctorPatientInteraction && !isMedicalStaff) {
            res.status(403).json({ message: 'You can only send messages to your doctor or patients' });
            return;
        }
        // Create message
        const message = new message_model_1.default({
            sender: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
            recipient: recipientId,
            content,
            status: message_model_1.MessageStatus.SENT,
            appointmentId: appointmentId ? (0, mongoose_utils_1.toObjectId)(appointmentId) : undefined,
        });
        // Process uploaded attachments
        if (req.files && Array.isArray(req.files)) {
            const attachmentPaths = req.files.map((file) => `/uploads/${file.filename}`);
            message.attachments = attachmentPaths;
        }
        await message.save();
        // Create notification for recipient
        const notification = new notification_model_1.default({
            user: recipientId,
            title: 'New Message',
            message: `You have a new message from ${sender.firstName} ${sender.lastName}`,
            type: notification_model_1.NotificationType.MESSAGE_RECEIVED,
            relatedId: message._id,
            relatedModel: 'Message'
        });
        await notification.save();
        res.status(201).json({
            message: 'Message sent successfully',
            data: message,
        });
    }
    catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.sendMessage = sendMessage;
// Get conversation between two users
const getConversation = async (req, res) => {
    var _a;
    try {
        const { userId } = req.params;
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Validate users exist
        const otherUser = await user_model_1.default.findById(userId);
        if (!otherUser) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Get messages between users (both directions)
        const messages = await message_model_1.default.find({
            $or: [
                { sender: currentUserId, recipient: userId },
                { sender: userId, recipient: currentUserId }
            ]
        })
            .sort({ createdAt: 1 })
            .populate('sender', 'firstName lastName profilePhoto role')
            .populate('recipient', 'firstName lastName profilePhoto role');
        // Mark messages as read if recipient is the current user
        const unreadMessageIds = messages
            .filter(msg => msg.recipient._id.toString() === currentUserId &&
            msg.status !== message_model_1.MessageStatus.READ)
            .map(msg => msg._id);
        if (unreadMessageIds.length > 0) {
            await message_model_1.default.updateMany({ _id: { $in: unreadMessageIds } }, { $set: { status: message_model_1.MessageStatus.READ } });
        }
        res.status(200).json({ messages });
    }
    catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getConversation = getConversation;
// Get list of conversations for a user
const getConversations = async (req, res) => {
    var _a;
    try {
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Get list of unique users the current user has conversed with
        const conversations = await message_model_1.default.aggregate([
            {
                $match: {
                    $or: [
                        { sender: (0, mongoose_utils_1.toObjectId)(currentUserId) },
                        { recipient: (0, mongoose_utils_1.toObjectId)(currentUserId) }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$sender', (0, mongoose_utils_1.toObjectId)(currentUserId)] },
                            '$recipient',
                            '$sender'
                        ]
                    },
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$recipient', (0, mongoose_utils_1.toObjectId)(currentUserId)] },
                                        { $ne: ['$status', message_model_1.MessageStatus.READ] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: '$userDetails'
            },
            {
                $project: {
                    _id: 1,
                    lastMessage: 1,
                    unreadCount: 1,
                    'userDetails.firstName': 1,
                    'userDetails.lastName': 1,
                    'userDetails.profilePhoto': 1,
                    'userDetails.role': 1
                }
            },
            {
                $sort: { 'lastMessage.createdAt': -1 }
            }
        ]);
        res.status(200).json({ conversations });
    }
    catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getConversations = getConversations;
// Delete a message (only sender can delete a message)
const deleteMessage = async (req, res) => {
    var _a;
    try {
        const { messageId } = req.params;
        const message = await message_model_1.default.findById(messageId);
        if (!message) {
            res.status(404).json({ message: 'Message not found' });
            return;
        }
        // Only the sender can delete the message
        if (message.sender.toString() !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            res.status(403).json({ message: 'Not authorized to delete this message' });
            return;
        }
        await message.deleteOne();
        res.status(200).json({ message: 'Message deleted successfully' });
    }
    catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteMessage = deleteMessage;
