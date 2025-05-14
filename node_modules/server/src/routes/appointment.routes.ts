import express from 'express';
import * as appointmentController from '../controllers/appointment.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { uploadAppointmentAttachments } from '../middlewares/upload.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create appointment
router.post(
  '/',
  uploadAppointmentAttachments,
  appointmentController.createAppointment
);

// Get available time slots
router.get('/available-slots', appointmentController.getAvailableSlots);

// Get user appointments
router.get('/user/:userId', appointmentController.getUserAppointments);

// Update appointment status
router.patch('/status/:id', appointmentController.updateAppointmentStatus);

// Update meeting link for telehealth appointment (doctor only)
router.patch(
  '/meeting-link/:id',
  authorize([UserRole.DOCTOR]),
  appointmentController.updateMeetingLink
);

// Admin and nurse routes
router.get(
  '/',
  authorize([UserRole.ADMIN, UserRole.NURSE]),
  appointmentController.getAllAppointments
);

// Get appointment by ID (must be after other specific routes)
router.get('/:id', appointmentController.getAppointmentById);

// Update appointment details
router.put(
  '/:id',
  uploadAppointmentAttachments,
  appointmentController.updateAppointment
);

// Admin only route
router.delete(
  '/:id',
  authorize([UserRole.ADMIN]),
  appointmentController.deleteAppointment
);

export default router; 