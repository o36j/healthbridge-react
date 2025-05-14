import { Request, Response } from 'express';
import UserPreferences from '../models/userPreferences.model';
import { logAuditEvent } from '../utils/auditLogger';
import { AuditAction } from '../models/auditLog.model';
import mongoose from 'mongoose';

/**
 * Get user preferences
 * 
 * @route GET /api/users/:id/preferences
 * @access Private - User can only access their own preferences unless they're an admin
 */
export const getUserPreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    
    // Authorization check
    if (req.user?.id !== userId && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Not authorized to access these preferences' });
      return;
    }
    
    // Find or create preferences
    let preferences = await UserPreferences.findOne({ userId });
    
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
  } catch (error) {
    console.error('Get user preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update user preferences
 * 
 * @route PUT /api/users/:id/preferences
 * @access Private - User can only update their own preferences unless they're an admin
 */
export const updateUserPreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    
    // Authorization check
    if (req.user?.id !== userId && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Not authorized to update these preferences' });
      return;
    }
    
    const {
      theme,
      compactMode,
      notifications,
      language,
      dateFormat,
      timeFormat
    } = req.body;
    
    // Validate required fields
    if (!theme) {
      res.status(400).json({ message: 'Theme is required' });
      return;
    }
    
    // Find existing preferences or create new ones
    let preferences = await UserPreferences.findOne({ userId });
    
    if (!preferences) {
      preferences = new UserPreferences({
        userId: new mongoose.Types.ObjectId(userId),
        theme,
        compactMode,
        notifications,
        language,
        dateFormat,
        timeFormat
      });
    } else {
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
    await logAuditEvent({
      action: AuditAction.USER_UPDATED,
      performedBy: req.user.id,
      performedOn: userId,
      details: 'User preferences updated',
      req
    });
    
    res.status(200).json({
      message: 'Preferences updated successfully',
      preferences
    });
  } catch (error) {
    console.error('Update user preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 