import { Request, Response } from 'express';
import AuditLog from '../models/auditLog.model';

/**
 * Get user activity history
 * 
 * @route GET /api/users/:id/activity
 * @access Private - User can only access their own activity history unless they're an admin
 */
export const getUserActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    
    // Authorization check
    if (req.user?.id !== userId && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Not authorized to view this activity history' });
      return;
    }
    
    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Filtering by type
    let query: any = {};
    
    // This user must be the subject or the performer
    query.$or = [
      { performedBy: userId },
      { performedOn: userId }
    ];
    
    // Filter by activity type
    if (req.query.type === 'login') {
      query.action = { $in: ['login_success', 'login_failed', 'logout'] };
    } else if (req.query.type === 'changes') {
      query.action = { $in: [
        'user_updated', 
        'profile_updated', 
        'password_updated', 
        'role_updated'
      ]};
    }
    
    // Count total documents matching query for pagination
    const total = await AuditLog.countDocuments(query);
    
    // Get audit logs with pagination
    const logs = await AuditLog.find(query)
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
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 