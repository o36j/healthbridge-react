import { Request, Response } from 'express';
import Appointment, { AppointmentStatus, IAppointment } from '../models/appointment.model';
import User, { UserRole } from '../models/user.model';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { toObjectId } from '../utils/mongoose.utils';

// Define interfaces for populated fields
interface PopulatedDoctor {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  specialization?: string;
}

interface PopulatedPatient {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
}

interface PopulatedAppointment extends Omit<IAppointment, 'patient' | 'doctor'> {
  _id: mongoose.Types.ObjectId;
  patient: PopulatedPatient;
  doctor: PopulatedDoctor;
}

// Create a new appointment
export const createAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      patientId,
      doctorId,
      date,
      startTime,
      endTime,
      reason,
      notes,
      isVirtual,
    } = req.body;
    
    // Validate fields
    if (!patientId || !doctorId || !date || !startTime || !endTime || !reason) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    
    // Only allow patients to create appointments for themselves or admin/medical staff to create for others
    if (
      req.user?.role === UserRole.PATIENT &&
      req.user?.id !== patientId
    ) {
      res.status(403).json({ message: 'Not authorized to create appointment for another patient' });
      return;
    }
    
    // Verify doctor exists and is a doctor
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== UserRole.DOCTOR) {
      res.status(400).json({ message: 'Invalid doctor ID' });
      return;
    }
    
    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient) {
      res.status(400).json({ message: 'Invalid patient ID' });
      return;
    }
    
    // If this is a telehealth appointment, verify doctor supports telehealth
    if (isVirtual && !doctor.professionalProfile?.telehealth) {
      res.status(400).json({ message: 'Selected doctor does not support telehealth appointments' });
      return;
    }
    
    // Check if doctor is available at the requested time
    const conflictingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date: new Date(date),
      $or: [
        { 
          startTime: { $lte: startTime }, 
          endTime: { $gt: startTime } 
        },
        { 
          startTime: { $lt: endTime }, 
          endTime: { $gte: endTime } 
        },
        { 
          startTime: { $gte: startTime }, 
          endTime: { $lte: endTime } 
        }
      ],
      status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] }
    });
    
    if (conflictingAppointment) {
      res.status(400).json({ message: 'Doctor is not available at the requested time' });
      return;
    }
    
    // Create appointment
    const appointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      date: new Date(date),
      startTime,
      endTime,
      status: AppointmentStatus.PENDING,
      reason,
      notes,
      isVirtual: isVirtual || false,
      createdBy: req.user?.id,
    });
    
    // Process uploaded attachments
    if (req.files && Array.isArray(req.files)) {
      const attachmentPaths = (req.files as Express.Multer.File[]).map(
        (file) => `/uploads/${file.filename}`
      );
      appointment.attachments = attachmentPaths;
    }
    
    await appointment.save();
    
    res.status(201).json({
      message: 'Appointment created successfully',
      appointment,
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get appointment by ID
export const getAppointmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const appointmentId = req.params.id;
    
    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'firstName lastName email profilePhoto')
      .populate('doctor', 'firstName lastName email department specialization profilePhoto');
    
    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }
    
    // Check if user has permission to view this appointment
    if (
      req.user?.role === UserRole.PATIENT &&
      appointment.patient._id.toString() !== req.user?.id
    ) {
      res.status(403).json({ message: 'Not authorized to view this appointment' });
      return;
    }
    
    if (
      req.user?.role === UserRole.DOCTOR &&
      appointment.doctor._id.toString() !== req.user?.id
    ) {
      res.status(403).json({ message: 'Not authorized to view this appointment' });
      return;
    }
    
    res.status(200).json({ appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get appointments for a user
export const getUserAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const { status, startDate, endDate } = req.query;
    
    // Only allow users to view their own appointments, unless they are medical staff or admin
    if (
      req.user?.id !== userId &&
      ![UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE].includes(req.user?.role as UserRole)
    ) {
      res.status(403).json({ message: 'Not authorized to view these appointments' });
      return;
    }
    
    // Find the user to determine role
    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Build query based on user role
    let query: any = {};
    
    if (user.role === UserRole.PATIENT) {
      query.patient = userId;
    } else if (user.role === UserRole.DOCTOR) {
      query.doctor = userId;
    }
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by date range if provided
    if (startDate || endDate) {
      query.date = {};
      
      if (startDate) {
        query.date.$gte = new Date(startDate as string);
      }
      
      if (endDate) {
        query.date.$lte = new Date(endDate as string);
      }
    }
    
    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName email profilePhoto')
      .populate('doctor', 'firstName lastName email department specialization profilePhoto')
      .sort({ date: 1, startTime: 1 });
    
    res.status(200).json({ appointments });
  } catch (error) {
    console.error('Get user appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const appointmentId = req.params.id;
    
    // Find appointment to update and populate patient and doctor fields
    const appointmentDoc = await Appointment.findById(appointmentId)
      .populate('patient', 'firstName lastName email')
      .populate('doctor', 'firstName lastName email');
    
    if (!appointmentDoc) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }
    
    // Cast to a properly typed appointment object
    const appointment = appointmentDoc as unknown as PopulatedAppointment;
    
    // Check if user has permission to update this appointment
    const isDoctor = req.user?.role === UserRole.DOCTOR && appointment.doctor._id.toString() === req.user?.id;
    const isPatient = req.user?.role === UserRole.PATIENT && appointment.patient._id.toString() === req.user?.id;
    const isAdminOrNurse = [UserRole.ADMIN, UserRole.NURSE].includes(req.user?.role as UserRole);
    
    if (!isDoctor && !isPatient && !isAdminOrNurse) {
      res.status(403).json({ message: 'Not authorized to update this appointment' });
      return;
    }
    
    // Check for valid status
    if (!Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
      res.status(400).json({ message: 'Invalid appointment status' });
      return;
    }
    
    // Certain status changes should only be allowed by specific roles
    if (status === AppointmentStatus.CONFIRMED && !isDoctor && !isAdminOrNurse) {
      res.status(403).json({ message: 'Only doctors, nurses, or admin can confirm appointments' });
      return;
    }
    
    if (status === AppointmentStatus.COMPLETED && !isDoctor && !isAdminOrNurse) {
      res.status(403).json({ message: 'Only doctors, nurses, or admin can mark appointments as completed' });
      return;
    }
    
    // Set appointment status
    appointment.status = status as AppointmentStatus;
    appointment.updatedBy = toObjectId(req.user?.id || '');
    
    await appointmentDoc.save();
    
    // Get patient and doctor data for notifications from the populated fields
    const patientData = appointment.patient;
    const doctorData = appointment.doctor;
    
    // Send notifications based on status change
    let patientNotificationTitle = '';
    let patientNotificationMessage = '';
    let doctorNotificationTitle = '';
    let doctorNotificationMessage = '';
    
    // Helper to format date for notifications
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };
    
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        // Appointment confirmed
        patientNotificationTitle = 'Appointment Confirmed';
        if (appointment.isVirtual) {
          patientNotificationMessage = `Your telehealth appointment with Dr. ${doctorData.lastName} on ${formatDate(appointment.date)} at ${appointment.startTime} has been confirmed.`;
        } else {
          patientNotificationMessage = `Your appointment with Dr. ${doctorData.lastName} on ${formatDate(appointment.date)} at ${appointment.startTime} has been confirmed.`;
        }
        
        // If patient is confirming, send notification to doctor
        if (isPatient) {
          if (appointment.isVirtual) {
            doctorNotificationTitle = 'Telehealth Appointment Confirmed';
            doctorNotificationMessage = `Telehealth appointment with ${patientData.firstName} ${patientData.lastName} on ${formatDate(appointment.date)} at ${appointment.startTime} has been confirmed.`;
          } else {
            doctorNotificationTitle = 'Appointment Confirmed';
            doctorNotificationMessage = `Appointment with ${patientData.firstName} ${patientData.lastName} on ${formatDate(appointment.date)} at ${appointment.startTime} has been confirmed.`;
          }
        }
        break;
      
      case AppointmentStatus.CANCELLED:
        // Appointment cancelled - notify other party
        if (req.user?.role === UserRole.DOCTOR) {
          patientNotificationTitle = 'Appointment Cancelled';
          patientNotificationMessage = `Your appointment with Dr. ${doctorData.lastName} on ${formatDate(appointment.date)} at ${appointment.startTime} has been cancelled by the doctor.`;
        } else if (req.user?.role === UserRole.PATIENT) {
          doctorNotificationTitle = 'Appointment Cancelled';
          doctorNotificationMessage = `The appointment with ${patientData.firstName} ${patientData.lastName} on ${formatDate(appointment.date)} at ${appointment.startTime} has been cancelled by the patient.`;
        }
        break;
        
      case AppointmentStatus.RESCHEDULED:
        // Appointment rescheduled - notify other party
        if (req.user?.role === UserRole.DOCTOR) {
          patientNotificationTitle = 'Appointment Rescheduled';
          patientNotificationMessage = `Your appointment with Dr. ${doctorData.lastName} has been rescheduled to ${formatDate(appointment.date)} at ${appointment.startTime}.`;
        } else if (req.user?.role === UserRole.PATIENT) {
          doctorNotificationTitle = 'Appointment Rescheduled';
          doctorNotificationMessage = `The appointment with ${patientData.firstName} ${patientData.lastName} has been rescheduled to ${formatDate(appointment.date)} at ${appointment.startTime}.`;
        }
        break;
        
      case AppointmentStatus.COMPLETED:
        // Appointment completed - notify patient
        patientNotificationTitle = 'Appointment Completed';
        patientNotificationMessage = `Your appointment with Dr. ${doctorData.lastName} on ${formatDate(appointment.date)} has been marked as completed.`;
        break;
    }
    
    // Handle notification creation and sending
    // ... implementation depends on notification system ...
    
    res.status(200).json({
      message: 'Appointment status updated successfully',
      appointment,
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update appointment details
export const updateAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const appointmentId = req.params.id;
    const {
      date,
      startTime,
      endTime,
      reason,
      notes,
    } = req.body;
    
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }
    
    // Check if the user has permission to update the appointment
    if (
      req.user?.role === UserRole.PATIENT &&
      appointment.patient.toString() !== req.user?.id
    ) {
      res.status(403).json({ message: 'Not authorized to update this appointment' });
      return;
    }
    
    if (
      req.user?.role === UserRole.DOCTOR &&
      appointment.doctor.toString() !== req.user?.id
    ) {
      res.status(403).json({ message: 'Not authorized to update this appointment' });
      return;
    }
    
    // If rescheduling, check for conflicts
    if (date && startTime && endTime) {
      const conflictingAppointment = await Appointment.findOne({
        _id: { $ne: appointmentId },
        doctor: appointment.doctor,
        date: new Date(date),
        $or: [
          { 
            startTime: { $lte: startTime }, 
            endTime: { $gt: startTime } 
          },
          { 
            startTime: { $lt: endTime }, 
            endTime: { $gte: endTime } 
          },
          { 
            startTime: { $gte: startTime }, 
            endTime: { $lte: endTime } 
          }
        ],
        status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] }
      });
      
      if (conflictingAppointment) {
        res.status(400).json({ message: 'Doctor is not available at the requested time' });
        return;
      }
      
      appointment.date = new Date(date);
      appointment.startTime = startTime;
      appointment.endTime = endTime;
      appointment.status = AppointmentStatus.RESCHEDULED;
    }
    
    // Update other fields
    if (reason) appointment.reason = reason;
    if (notes) appointment.notes = notes;
    
    appointment.updatedBy = toObjectId(req.user?.id);
    
    // Process uploaded attachments
    if (req.files && Array.isArray(req.files)) {
      const attachmentPaths = (req.files as Express.Multer.File[]).map(
        (file) => `/uploads/${file.filename}`
      );
      appointment.attachments = [...(appointment.attachments || []), ...attachmentPaths];
    }
    
    await appointment.save();
    
    res.status(200).json({
      message: 'Appointment updated successfully',
      appointment,
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all appointments (admin only)
export const getAllAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admin and nurses can get all appointments
    if (![UserRole.ADMIN, UserRole.NURSE].includes(req.user?.role as UserRole)) {
      res.status(403).json({ message: 'Not authorized to access this resource' });
      return;
    }
    
    const { status, doctor, patient, department, startDate, endDate } = req.query;
    
    let query: any = {};
    
    // Apply filters
    if (status) query.status = status;
    if (doctor) query.doctor = doctor;
    if (patient) query.patient = patient;
    
    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      
      if (startDate) {
        query.date.$gte = new Date(startDate as string);
      }
      
      if (endDate) {
        query.date.$lte = new Date(endDate as string);
      }
    }
    
    // For department filter, we need to join with the users collection
    let appointments;
    
    if (department) {
      // Find doctors in the specified department
      const doctors = await User.find({ 
        role: UserRole.DOCTOR, 
        department 
      }).select('_id');
      
      const doctorIds = doctors.map(d => d._id);
      
      // Add doctor filter
      query.doctor = { $in: doctorIds };
    }
    
    appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName email profilePhoto')
      .populate('doctor', 'firstName lastName email department specialization profilePhoto')
      .sort({ date: 1, startTime: 1 });
    
    res.status(200).json({ appointments });
  } catch (error) {
    console.error('Get all appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete appointment (admin only)
export const deleteAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admin can delete appointments
    if (req.user?.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Not authorized to delete appointments' });
      return;
    }
    
    const appointmentId = req.params.id;
    
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }
    
    // Delete attachments if any
    if (appointment.attachments && appointment.attachments.length > 0) {
      for (const attachment of appointment.attachments) {
        const filePath = path.join(__dirname, '../../uploads', path.basename(attachment));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
    
    await Appointment.findByIdAndDelete(appointmentId);
    
    res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get available time slots for a doctor on a specific date
export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctor: doctorId, date } = req.query;
    
    if (!doctorId || !date) {
      res.status(400).json({ message: 'Doctor ID and date are required' });
      return;
    }
    
    // Verify doctor exists and is a doctor
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== UserRole.DOCTOR) {
      res.status(400).json({ message: 'Invalid doctor ID' });
      return;
    }
    
    // Define working hours (8 AM to 5 PM, 30 minute increments)
    const workingHours = {
      start: 8, // 8 AM
      end: 17,  // 5 PM
    };
    
    // Generate all possible time slots
    const allTimeSlots: string[] = [];
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      allTimeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      allTimeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
    // Find existing appointments for the doctor on the specified date
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      date: new Date(date as string),
      status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
    }).sort({ startTime: 1 });
    
    // Filter out time slots that are already booked
    const availableSlots = allTimeSlots.filter(slot => {
      // Check if this slot overlaps with any existing appointment
      return !existingAppointments.some(appointment => {
        return (
          (slot >= appointment.startTime && slot < appointment.endTime) ||
          // Don't allow booking the last slot of the day since it needs an end time
          (slot === allTimeSlots[allTimeSlots.length - 1])
        );
      });
    });
    
    res.status(200).json({ availableSlots });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add meeting link to telehealth appointment (doctor only)
export const updateMeetingLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const appointmentId = req.params.id;
    const { meetingLink } = req.body;
    
    if (!meetingLink) {
      res.status(400).json({ message: 'Meeting link is required' });
      return;
    }
    
    // Find appointment
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }
    
    // Only doctors can update the meeting link for their own appointments
    if (
      req.user?.role !== UserRole.DOCTOR ||
      appointment.doctor.toString() !== req.user.id
    ) {
      res.status(403).json({ message: 'Not authorized to update meeting link' });
      return;
    }
    
    // Verify this is a telehealth appointment
    if (!appointment.isVirtual) {
      res.status(400).json({ message: 'Cannot add meeting link to non-telehealth appointment' });
      return;
    }
    
    // Verify the appointment is confirmed
    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      res.status(400).json({ message: 'Can only add meeting link to confirmed appointments' });
      return;
    }
    
    // Update the meeting link
    appointment.meetingLink = meetingLink;
    appointment.updatedBy = toObjectId(req.user.id);
    
    await appointment.save();
    
    // Notify the patient about the updated meeting link
    // ... notification implementation ...
    
    res.status(200).json({
      message: 'Meeting link updated successfully',
      appointment,
    });
  } catch (error) {
    console.error('Update meeting link error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 