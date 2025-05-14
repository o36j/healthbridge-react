import { Request, Response } from 'express';
import Notification from '../models/notification.model';
import { toObjectId } from '../utils/mongoose.utils';

// Get notifications for the current user
export const getUserNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 20, skip = 0, unreadOnly = false } = req.query;
    
    const query: any = { user: req.user?.id };
    
    // Filter by read status if requested
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    // Get total count for pagination
    const totalCount = await Notification.countDocuments(query);
    
    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));
    
    // Get unread count
    const unreadCount = await Notification.countDocuments({
      user: req.user?.id,
      read: false
    });
    
    res.status(200).json({
      notifications,
      totalCount,
      unreadCount
    });
  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }
    
    // Ensure the notification belongs to the current user
    if (notification.user.toString() !== req.user?.id) {
      res.status(403).json({ message: 'Not authorized to update this notification' });
      return;
    }
    
    notification.read = true;
    await notification.save();
    
    res.status(200).json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    await Notification.updateMany(
      { user: req.user?.id, read: false },
      { $set: { read: true } }
    );
    
    res.status(200).json({
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a notification
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }
    
    // Ensure the notification belongs to the current user
    if (notification.user.toString() !== req.user?.id) {
      res.status(403).json({ message: 'Not authorized to delete this notification' });
      return;
    }
    
    await notification.deleteOne();
    
    res.status(200).json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a notification (internal use only, not exposed as API)
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: string,
  relatedId?: string,
  relatedModel?: string
) => {
  try {
    const notification = new Notification({
      user: toObjectId(userId),
      title,
      message,
      type,
      relatedId: relatedId ? toObjectId(relatedId) : undefined,
      relatedModel: relatedModel || undefined
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
}; 