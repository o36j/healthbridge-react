import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../models/user.model';
import AuditLog, { AuditAction } from '../models/auditLog.model';
import * as authController from '../controllers/auth.controller';
import * as statisticsController from '../controllers/statistics.controller';
import { uploadProfilePhoto } from '../middlewares/upload.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { registerSchema } from '../validations/auth.validation';

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize([UserRole.ADMIN]));

/**
 * POST /api/admin/create-user
 * Admin route to create users without rate limiting
 */
router.post('/create-user',
  uploadProfilePhoto,
  validateRequest(registerSchema),
  authController.register
);

// Get audit logs with filtering and pagination
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 20, action, userId, startDate, endDate } = req.query;
    
    // Build query
    const query: any = {};
    
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
        query.createdAt.$gte = new Date(startDate as string);
      }
      
      if (endDate) {
        query.createdAt.$lte = new Date(endDate as string);
      }
    }
    
    // Calculate pagination
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Get total count for pagination
    const total = await AuditLog.countDocuments(query);
    
    // Get audit logs with population
    const auditLogs = await AuditLog.find(query)
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
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available audit actions for filtering
router.get('/audit-actions', (req, res) => {
  try {
    // Use Object.values on the AuditAction enum to get all enum values
    const actions = Object.values(AuditAction);
    res.status(200).json({ actions });
  } catch (error) {
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
    const totalLogs = await AuditLog.countDocuments();
    const logsToday = await AuditLog.countDocuments({ createdAt: { $gte: today } });
    const logsThisWeek = await AuditLog.countDocuments({ createdAt: { $gte: weekAgo } });
    const logsThisMonth = await AuditLog.countDocuments({ createdAt: { $gte: monthAgo } });
    
    // Most active users
    const mostActiveUsers = await AuditLog.aggregate([
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
    const actionDistribution = await AuditLog.aggregate([
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
  } catch (error) {
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

export default router; 