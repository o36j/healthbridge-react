import express from 'express';
import * as messageController from '../controllers/message.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadMessageAttachments } from '../middlewares/upload.middleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Send a new message
router.post(
  '/',
  uploadMessageAttachments,
  messageController.sendMessage
);

// Get conversation between two users
router.get(
  '/conversation/:userId',
  messageController.getConversation
);

// Get list of conversations for a user
router.get(
  '/conversations',
  messageController.getConversations
);

// Delete a message
router.delete(
  '/:messageId',
  messageController.deleteMessage
);

export default router; 