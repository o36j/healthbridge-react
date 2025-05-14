import express from 'express';
import * as patientHistoryController from '../controllers/patientHistory.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { uploadPatientHistoryAttachments } from '../middlewares/upload.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create patient history record
router.post(
  '/',
  authorize([UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]),
  uploadPatientHistoryAttachments,
  patientHistoryController.createPatientHistory
);

// Get patient history record by ID
router.get('/:id', patientHistoryController.getPatientHistoryById);

// Get all patient history records for a patient
router.get('/patient/:patientId', patientHistoryController.getPatientHistoryByPatient);

// Update patient history record
router.put(
  '/:id',
  authorize([UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]),
  uploadPatientHistoryAttachments,
  patientHistoryController.updatePatientHistory
);

// Get all patient history records (for authorized staff)
router.get(
  '/',
  authorize([UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]),
  patientHistoryController.getAllPatientHistoryRecords
);

// Delete patient history record (admin only)
router.delete(
  '/:id',
  authorize([UserRole.ADMIN]),
  patientHistoryController.deletePatientHistory
);

export default router; 