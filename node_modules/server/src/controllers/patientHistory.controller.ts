import { Request, Response } from 'express';
import PatientHistory from '../models/patientHistory.model';
import User, { UserRole } from '../models/user.model';
import fs from 'fs';
import path from 'path';
import { toObjectId } from '../utils/mongoose.utils';

// Create patient history record
export const createPatientHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      patientId,
      doctorId,
      visitDate,
      diagnosis,
      symptoms,
      notes,
      vitals,
      prescriptions,
      followUpDate,
    } = req.body;
    
    // Validate required fields
    if (!patientId || !doctorId || !diagnosis || !notes) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    
    // Only doctors, nurses, and admins can create patient history records
    if (![UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN].includes(req.user?.role as UserRole)) {
      res.status(403).json({ message: 'Not authorized to create patient history records' });
      return;
    }
    
    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== UserRole.PATIENT) {
      res.status(400).json({ message: 'Invalid patient ID' });
      return;
    }
    
    // Verify doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== UserRole.DOCTOR) {
      res.status(400).json({ message: 'Invalid doctor ID' });
      return;
    }
    
    // Create patient history record
    const patientHistory = new PatientHistory({
      patient: patientId,
      doctor: doctorId,
      visitDate: visitDate ? new Date(visitDate) : new Date(),
      diagnosis,
      symptoms: symptoms || [],
      notes,
      vitals: vitals || {},
      prescriptions: prescriptions || [],
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      createdBy: req.user?.id,
    });
    
    // Process uploaded attachments
    if (req.files && Array.isArray(req.files)) {
      const attachmentPaths = (req.files as Express.Multer.File[]).map(
        (file) => `/uploads/${file.filename}`
      );
      patientHistory.attachments = attachmentPaths;
    }
    
    await patientHistory.save();
    
    res.status(201).json({
      message: 'Patient history record created successfully',
      patientHistory,
    });
  } catch (error) {
    console.error('Create patient history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get patient history record by ID
export const getPatientHistoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const recordId = req.params.id;
    
    const patientHistory = await PatientHistory.findById(recordId)
      .populate('patient', 'firstName lastName email profilePhoto medicalRecordNumber')
      .populate('doctor', 'firstName lastName email department specialization profilePhoto');
    
    if (!patientHistory) {
      res.status(404).json({ message: 'Patient history record not found' });
      return;
    }
    
    // Patients can only view their own records
    if (
      req.user?.role === UserRole.PATIENT &&
      patientHistory.patient._id.toString() !== req.user?.id
    ) {
      res.status(403).json({ message: 'Not authorized to view this record' });
      return;
    }
    
    res.status(200).json({ patientHistory });
  } catch (error) {
    console.error('Get patient history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all patient history records for a patient
export const getPatientHistoryByPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = req.params.patientId;
    
    // Patients can only view their own records
    if (req.user?.role === UserRole.PATIENT && req.user?.id !== patientId) {
      res.status(403).json({ message: 'Not authorized to view these records' });
      return;
    }
    
    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }
    
    const patientHistory = await PatientHistory.find({ patient: patientId })
      .populate('doctor', 'firstName lastName email department specialization profilePhoto')
      .sort({ visitDate: -1 });
    
    res.status(200).json({ patientHistory });
  } catch (error) {
    console.error('Get patient history by patient error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update patient history record
export const updatePatientHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const recordId = req.params.id;
    
    // Only doctors, nurses, and admins can update patient history records
    if (![UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN].includes(req.user?.role as UserRole)) {
      res.status(403).json({ message: 'Not authorized to update patient history records' });
      return;
    }
    
    const patientHistory = await PatientHistory.findById(recordId);
    
    if (!patientHistory) {
      res.status(404).json({ message: 'Patient history record not found' });
      return;
    }
    
    const {
      diagnosis,
      symptoms,
      notes,
      vitals,
      prescriptions,
      followUpDate,
    } = req.body;
    
    // Update fields
    if (diagnosis) patientHistory.diagnosis = diagnosis;
    if (symptoms) patientHistory.symptoms = symptoms;
    if (notes) patientHistory.notes = notes;
    if (vitals) patientHistory.vitals = { ...patientHistory.vitals, ...vitals };
    if (prescriptions) patientHistory.prescriptions = prescriptions;
    if (followUpDate) patientHistory.followUpDate = new Date(followUpDate);
    
    // Update updatedBy field
    patientHistory.updatedBy = toObjectId(req.user?.id);
    
    // Process uploaded attachments
    if (req.files && Array.isArray(req.files)) {
      const attachmentPaths = (req.files as Express.Multer.File[]).map(
        (file) => `/uploads/${file.filename}`
      );
      patientHistory.attachments = [...(patientHistory.attachments || []), ...attachmentPaths];
    }
    
    await patientHistory.save();
    
    res.status(200).json({
      message: 'Patient history record updated successfully',
      patientHistory,
    });
  } catch (error) {
    console.error('Update patient history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete patient history record (admin only)
export const deletePatientHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admin can delete patient history records
    if (req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Not authorized to delete patient history records' });
      return;
    }
    
    const recordId = req.params.id;
    
    const patientHistory = await PatientHistory.findById(recordId);
    
    if (!patientHistory) {
      res.status(404).json({ message: 'Patient history record not found' });
      return;
    }
    
    // Delete attachments if any
    if (patientHistory.attachments && patientHistory.attachments.length > 0) {
      for (const attachment of patientHistory.attachments) {
        const filePath = path.join(__dirname, '../../uploads', path.basename(attachment));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
    
    await PatientHistory.findByIdAndDelete(recordId);
    
    res.status(200).json({ message: 'Patient history record deleted successfully' });
  } catch (error) {
    console.error('Delete patient history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all patient history records (admin only)
export const getAllPatientHistoryRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admin, doctors, and nurses can get all patient history records
    if (![UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE].includes(req.user?.role as UserRole)) {
      res.status(403).json({ message: 'Not authorized to access this resource' });
      return;
    }
    
    const { patient, doctor, startDate, endDate, diagnosis } = req.query;
    
    let query: any = {};
    
    // Apply filters
    if (patient) query.patient = patient;
    if (doctor) query.doctor = doctor;
    
    // Filter by date range
    if (startDate || endDate) {
      query.visitDate = {};
      
      if (startDate) {
        query.visitDate.$gte = new Date(startDate as string);
      }
      
      if (endDate) {
        query.visitDate.$lte = new Date(endDate as string);
      }
    }
    
    // Filter by diagnosis
    if (diagnosis) {
      query.diagnosis = { $regex: diagnosis as string, $options: 'i' };
    }
    
    // Doctors can only see their patients' records
    if (req.user?.role === UserRole.DOCTOR) {
      query.doctor = req.user.id;
    }
    
    const patientHistory = await PatientHistory.find(query)
      .populate('patient', 'firstName lastName email profilePhoto medicalRecordNumber')
      .populate('doctor', 'firstName lastName email department specialization profilePhoto')
      .sort({ visitDate: -1 });
    
    res.status(200).json({ patientHistory });
  } catch (error) {
    console.error('Get all patient history records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 