import { Request, Response } from 'express';
import Message, { MessageStatus } from '../models/message.model';
import User, { UserRole } from '../models/user.model';
import Notification, { NotificationType } from '../models/notification.model';
import mongoose from 'mongoose';
import { toObjectId } from '../utils/mongoose.utils';

// Send a new message
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipientId, content, appointmentId } = req.body;
    
    // Validate required fields
    if (!recipientId || !content) {
      res.status(400).json({ message: 'Recipient and content are required' });
      return;
    }
    
    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      res.status(404).json({ message: 'Recipient not found' });
      return;
    }
    
    // Validate that messages can only be sent between doctors and patients
    const sender = await User.findById(req.user?.id);
    if (!sender) {
      res.status(404).json({ message: 'Sender not found' });
      return;
    }
    
    // Check if it's a doctor-patient interaction
    const isValidDoctorPatientInteraction = 
      (sender.role === UserRole.DOCTOR && recipient.role === UserRole.PATIENT) ||
      (sender.role === UserRole.PATIENT && recipient.role === UserRole.DOCTOR);
    
    // Allow admin and nurse to message anyone
    const isMedicalStaff = [UserRole.ADMIN, UserRole.NURSE].includes(sender.role as UserRole);
    
    if (!isValidDoctorPatientInteraction && !isMedicalStaff) {
      res.status(403).json({ message: 'You can only send messages to your doctor or patients' });
      return;
    }
    
    // Create message
    const message = new Message({
      sender: req.user?.id,
      recipient: recipientId,
      content,
      status: MessageStatus.SENT,
      appointmentId: appointmentId ? toObjectId(appointmentId) : undefined,
    });
    
    // Process uploaded attachments
    if (req.files && Array.isArray(req.files)) {
      const attachmentPaths = (req.files as Express.Multer.File[]).map(
        (file) => `/uploads/${file.filename}`
      );
      message.attachments = attachmentPaths;
    }
    
    await message.save();
    
    // Create notification for recipient
    const notification = new Notification({
      user: recipientId,
      title: 'New Message',
      message: `You have a new message from ${sender.firstName} ${sender.lastName}`,
      type: NotificationType.MESSAGE_RECEIVED,
      relatedId: message._id,
      relatedModel: 'Message'
    });
    
    await notification.save();
    
    res.status(201).json({
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get conversation between two users
export const getConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    
    // Validate users exist
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Get messages between users (both directions)
    const messages = await Message.find({
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
      .filter(msg => 
        msg.recipient._id.toString() === currentUserId && 
        msg.status !== MessageStatus.READ
      )
      .map(msg => msg._id);
    
    if (unreadMessageIds.length > 0) {
      await Message.updateMany(
        { _id: { $in: unreadMessageIds } },
        { $set: { status: MessageStatus.READ } }
      );
    }
    
    res.status(200).json({ messages });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get list of conversations for a user
export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    
    // Get list of unique users the current user has conversed with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: toObjectId(currentUserId) },
            { recipient: toObjectId(currentUserId) }
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
              { $eq: ['$sender', toObjectId(currentUserId)] },
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
                    { $eq: ['$recipient', toObjectId(currentUserId)] },
                    { $ne: ['$status', MessageStatus.READ] }
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
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a message (only sender can delete a message)
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      res.status(404).json({ message: 'Message not found' });
      return;
    }
    
    // Only the sender can delete the message
    if (message.sender.toString() !== req.user?.id) {
      res.status(403).json({ message: 'Not authorized to delete this message' });
      return;
    }
    
    await message.deleteOne();
    
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 