"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserActivity = void 0;
const auditLog_model_1 = __importDefault(require("../models/auditLog.model"));
/**
 * Get user activity history
 *
 * @route GET /api/users/:id/activity
 * @access Private - User can only access their own activity history unless they're an admin
 */
const getUserActivity = async (req, res) => {
    var _a, _b;
    try {
        const userId = req.params.id;
        // Authorization check
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== userId && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'admin') {
            res.status(403).json({ message: 'Not authorized to view this activity history' });
            return;
        }
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Filtering by type
        let query = {};
        // This user must be the subject or the performer
        query.$or = [
            { performedBy: userId },
            { performedOn: userId }
        ];
        // Filter by activity type
        if (req.query.type === 'login') {
            query.action = { $in: ['login_success', 'login_failed', 'logout'] };
        }
        else if (req.query.type === 'changes') {
            query.action = { $in: [
                    'user_updated',
                    'profile_updated',
                    'password_updated',
                    'role_updated'
                ] };
        }
        // Count total documents matching query for pagination
        const total = await auditLog_model_1.default.countDocuments(query);
        // Get audit logs with pagination
        const logs = await auditLog_model_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('performedBy', 'firstName lastName email')
            .populate('performedOn', 'firstName lastName email');
        // Calculate pagination info
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        res.status(200).json({
            logs,
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        });
    }
    catch (error) {
        console.error('Get user activity error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserActivity = getUserActivity;
