"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = __importDefault(require("./config/database"));
const errorHandler_middleware_1 = __importDefault(require("./middlewares/errorHandler.middleware"));
const path_1 = __importDefault(require("path"));
// Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const appointment_routes_1 = __importDefault(require("./routes/appointment.routes"));
const patientHistory_routes_1 = __importDefault(require("./routes/patientHistory.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const chatbot_routes_1 = __importDefault(require("./routes/chatbot.routes"));
const medication_routes_1 = __importDefault(require("./routes/medication.routes"));
// Load environment variables
dotenv_1.default.config();
// Set NODE_ENV to development if not set
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
}
// Connect to MongoDB
(0, database_1.default)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: {
        policy: 'cross-origin'
    },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'blob:', '*'],
            connectSrc: ["'self'", '*']
        }
    }
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // limit each IP to 5000 requests per windowMs (for testing purposes i made it 5000 put it back to 1000 when done testing)
    message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);
// Middlewares
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// CORS configuration - must be before routes
const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5174'
];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Configure static file serving with CORS headers
app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/appointments', appointment_routes_1.default);
app.use('/api/patient-history', patientHistory_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/messages', message_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/chatbot', chatbot_routes_1.default);
app.use('/api/medications', medication_routes_1.default);
// Root route
app.get('/', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'HealthBridge API server is running. Access the client application at the appropriate URL.'
    });
});
// Health check route
app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'success', message: 'API is running' });
});
// Error handling middleware
app.use(errorHandler_middleware_1.default);
// Start server
app.listen(PORT, () => {
    // Server is running
});
