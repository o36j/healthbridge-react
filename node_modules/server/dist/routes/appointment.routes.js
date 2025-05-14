"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const appointmentController = __importStar(require("../controllers/appointment.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(auth_middleware_1.authenticate);
// Create appointment
router.post('/', upload_middleware_1.uploadAppointmentAttachments, appointmentController.createAppointment);
// Get available time slots
router.get('/available-slots', appointmentController.getAvailableSlots);
// Get user appointments
router.get('/user/:userId', appointmentController.getUserAppointments);
// Update appointment status
router.patch('/status/:id', appointmentController.updateAppointmentStatus);
// Update meeting link for telehealth appointment (doctor only)
router.patch('/meeting-link/:id', (0, auth_middleware_1.authorize)([user_model_1.UserRole.DOCTOR]), appointmentController.updateMeetingLink);
// Admin and nurse routes
router.get('/', (0, auth_middleware_1.authorize)([user_model_1.UserRole.ADMIN, user_model_1.UserRole.NURSE]), appointmentController.getAllAppointments);
// Get appointment by ID (must be after other specific routes)
router.get('/:id', appointmentController.getAppointmentById);
// Update appointment details
router.put('/:id', upload_middleware_1.uploadAppointmentAttachments, appointmentController.updateAppointment);
// Admin only route
router.delete('/:id', (0, auth_middleware_1.authorize)([user_model_1.UserRole.ADMIN]), appointmentController.deleteAppointment);
exports.default = router;
