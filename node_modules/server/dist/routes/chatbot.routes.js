"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatbot_controller_1 = require("../controllers/chatbot.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = express_1.default.Router();
// Create rate limiters
const authenticatedLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute for authenticated users
    message: 'Too many requests from this user, please try again later'
});
const publicLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute for public users
    message: 'Too many requests, please try again later'
});
// Health check endpoint (public)
router.get('/health', chatbot_controller_1.healthCheck);
// Chat response endpoint for authenticated users (with higher rate limit)
router.post('/generate', auth_middleware_1.authenticate, authenticatedLimiter, chatbot_controller_1.generateChatResponse);
// Chat response endpoint for public users (with lower rate limit)
router.post('/public/generate', publicLimiter, chatbot_controller_1.generateChatResponse);
exports.default = router;
