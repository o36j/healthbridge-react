import express from 'express';
import { generateChatResponse, healthCheck } from '../controllers/chatbot.controller';
import { authenticate } from '../middlewares/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Create rate limiters
const authenticatedLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute for authenticated users
  message: 'Too many requests from this user, please try again later'
});

const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute for public users
  message: 'Too many requests, please try again later'
});

// Health check endpoint (public)
router.get('/health', healthCheck);

// Chat response endpoint for authenticated users (with higher rate limit)
router.post(
  '/generate',
  authenticate,
  authenticatedLimiter,
  generateChatResponse
);

// Chat response endpoint for public users (with lower rate limit)
router.post(
  '/public/generate',
  publicLimiter,
  generateChatResponse
);

export default router; 