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
const auth_middleware_1 = require("../middlewares/auth.middleware");
const user_model_1 = require("../models/user.model");
const auditLog_model_1 = __importStar(require("../models/auditLog.model"));
const authController = __importStar(require("../controllers/auth.controller"));
const statisticsController = __importStar(require("../controllers/statistics.controller"));
const upload_middleware_1 = require("../middlewares/upload.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const auth_validation_1 = require("../validations/auth.validation");
const router = express_1.default.Router();
// Apply authentication and admin authorization to all routes
router.use(auth_middleware_1.authenticate);
router.use((0, auth_middleware_1.authorize)([user_model_1.UserRole.ADMIN]));
/**
 * POST /api/admin/create-user
 * Admin route to create users without rate limiting
 */
router.post('/create-user', upload_middleware_1.uploadProfilePhoto, (0, validate_middleware_1.validateRequest)(auth_validation_1.registerSchema), authController.register);
// Get audit logs with filtering and pagination
router.get('/audit-logs', async (req, res) => {
    try {
        const { page = 1, limit = 20, action, userId, startDate, endDate } = req.query;
        // Build query
        const query = {};
        if (action) {
            query.action = action;
        }
        if (userId) {
            query.$or = [
                { performedBy: userId },
                { performedOn: userId }
            ];
        }
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }
        // Calculate pagination
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;
        // Get total count for pagination
        const total = await auditLog_model_1.default.countDocuments(query);
        // Get audit logs with population
        const auditLogs = await auditLog_model_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber)
            .populate('performedBy', 'firstName lastName email')
            .populate('performedOn', 'firstName lastName email');
        res.status(200).json({
            auditLogs,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber)
            }
        });
    }
    catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get available audit actions for filtering
router.get('/audit-actions', (req, res) => {
    try {
        // Use Object.values on the AuditAction enum to get all enum values
        const actions = Object.values(auditLog_model_1.AuditAction);
        res.status(200).json({ actions });
    }
    catch (error) {
        console.error('Get audit actions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get audit statistics for dashboard
router.get('/audit-stats', async (req, res) => {
    try {
        // Get today's date at 00:00:00
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Get 7 days ago
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        // Get 30 days ago
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        // Counts
        const totalLogs = await auditLog_model_1.default.countDocuments();
        const logsToday = await auditLog_model_1.default.countDocuments({ createdAt: { $gte: today } });
        const logsThisWeek = await auditLog_model_1.default.countDocuments({ createdAt: { $gte: weekAgo } });
        const logsThisMonth = await auditLog_model_1.default.countDocuments({ createdAt: { $gte: monthAgo } });
        // Most active users
        const mostActiveUsers = await auditLog_model_1.default.aggregate([
            { $group: { _id: '$performedBy', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    'user.firstName': 1,
                    'user.lastName': 1,
                    'user.email': 1
                }
            }
        ]);
        // Action distribution
        const actionDistribution = await auditLog_model_1.default.aggregate([
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        res.status(200).json({
            counts: {
                total: totalLogs,
                today: logsToday,
                thisWeek: logsThisWeek,
                thisMonth: logsThisMonth
            },
            mostActiveUsers,
            actionDistribution
        });
    }
    catch (error) {
        console.error('Get audit stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Statistics Routes
router.get('/statistics/summary', statisticsController.getStatisticsSummary);
router.get('/statistics/appointment-timeline', statisticsController.getAppointmentTimeline);
router.get('/statistics/department-load', statisticsController.getDepartmentLoad);
router.get('/statistics/doctor-performance', statisticsController.getDoctorPerformance);
router.get('/statistics/common-diagnoses', statisticsController.getCommonDiagnoses);
router.get('/statistics/common-medications', statisticsController.getCommonMedications);
router.get('/statistics/user-growth', statisticsController.getUserGrowth);
exports.default = router;
