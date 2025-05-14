import express from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get notifications for the current user
router.get(
  '/',
  notificationController.getUserNotifications
);

// Mark notification as read
router.patch(
  '/:notificationId/read',
  notificationController.markNotificationAsRead
);

// Mark all notifications as read
router.patch(
  '/mark-all-read',
  notificationController.markAllNotificationsAsRead
);

// Delete a notification
router.delete(
  '/:notificationId',
  notificationController.deleteNotification
);

export default router; 