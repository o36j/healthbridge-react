import { Request, Response } from 'express';
import Medication from '../models/medication.model';
import { UserRole } from '../models/user.model';
import { toObjectId } from '../utils/mongoose.utils';

// Create a new medication
export const createMedication = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only doctors, pharmacists, and admins can create medications
    if (!req.user || ![UserRole.DOCTOR, UserRole.ADMIN, UserRole.NURSE].includes(req.user.role as UserRole)) {
      res.status(403).json({ message: 'Not authorized to create medications' });
      return;
    }

    const {
      name,
      description,
      warnings,
      sideEffects,
      dosageForm,
      strength,
      manufacturer,
    } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Medication name is required' });
      return;
    }

    // Check if medication already exists
    const existingMedication = await Medication.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingMedication) {
      res.status(400).json({ message: 'A medication with this name already exists' });
      return;
    }

    const medication = new Medication({
      name,
      description,
      warnings: warnings || [],
      sideEffects: sideEffects || [],
      dosageForm,
      strength,
      manufacturer,
      createdBy: req.user.id,
    });

    await medication.save();

    res.status(201).json({
      message: 'Medication created successfully',
      medication,
    });
  } catch (error) {
    console.error('Create medication error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all medications with optional search
export const getMedications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    
    let query = {};
    
    // If search parameter is provided, use text search
    if (search && typeof search === 'string' && search.trim()) {
      query = { 
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ] 
      };
    }
    
    const medications = await Medication.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Medication.countDocuments(query);
    
    res.status(200).json({
      medications,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get medication by ID
export const getMedicationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const medication = await Medication.findById(id);
    
    if (!medication) {
      res.status(404).json({ message: 'Medication not found' });
      return;
    }
    
    res.status(200).json({ medication });
  } catch (error) {
    console.error('Get medication by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update medication
export const updateMedication = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only doctors, pharmacists, and admins can update medications
    if (!req.user || ![UserRole.DOCTOR, UserRole.ADMIN, UserRole.NURSE].includes(req.user.role as UserRole)) {
      res.status(403).json({ message: 'Not authorized to update medications' });
      return;
    }
    
    const { id } = req.params;
    
    const {
      name,
      description,
      warnings,
      sideEffects,
      dosageForm,
      strength,
      manufacturer,
    } = req.body;
    
    const medication = await Medication.findById(id);
    
    if (!medication) {
      res.status(404).json({ message: 'Medication not found' });
      return;
    }
    
    // Update fields if provided
    if (name) medication.name = name;
    if (description !== undefined) medication.description = description;
    if (warnings) medication.warnings = warnings;
    if (sideEffects) medication.sideEffects = sideEffects;
    if (dosageForm !== undefined) medication.dosageForm = dosageForm;
    if (strength !== undefined) medication.strength = strength;
    if (manufacturer !== undefined) medication.manufacturer = manufacturer;
    
    medication.updatedBy = toObjectId(req.user.id);
    
    await medication.save();
    
    res.status(200).json({
      message: 'Medication updated successfully',
      medication,
    });
  } catch (error) {
    console.error('Update medication error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete medication (admin only)
export const deleteMedication = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admins can delete medications
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Not authorized to delete medications' });
      return;
    }
    
    const { id } = req.params;
    
    const medication = await Medication.findById(id);
    
    if (!medication) {
      res.status(404).json({ message: 'Medication not found' });
      return;
    }
    
    await medication.deleteOne();
    
    res.status(200).json({
      message: 'Medication deleted successfully',
    });
  } catch (error) {
    console.error('Delete medication error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 