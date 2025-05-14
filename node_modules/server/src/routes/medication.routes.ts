import express from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  createMedication,
  getMedications,
  getMedicationById,
  updateMedication,
  deleteMedication,
} from '../controllers/medication.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create a new medication
router.post('/', createMedication);

// Get all medications (with optional search)
router.get('/', getMedications);

// Get medication by ID
router.get('/:id', getMedicationById);

// Update medication by ID
router.put('/:id', updateMedication);

// Delete medication by ID (admin only)
router.delete('/:id', deleteMedication);

export default router; 