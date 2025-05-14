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
exports.updateMeetingLink = exports.getAvailableSlots = exports.deleteAppointment = exports.getAllAppointments = exports.updateAppointment = exports.updateAppointmentStatus = exports.getUserAppointments = exports.getAppointmentById = exports.createAppointment = void 0;
const appointment_model_1 = __importStar(require("../models/appointment.model"));
const user_model_1 = __importStar(require("../models/user.model"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mongoose_utils_1 = require("../utils/mongoose.utils");
// Create a new appointment
const createAppointment = async (req, res) => {
    var _a, _b, _c, _d;
    try {
        const { patientId, doctorId, date, startTime, endTime, reason, notes, isVirtual, } = req.body;
        // Validate fields
        if (!patientId || !doctorId || !date || !startTime || !endTime || !reason) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        // Only allow patients to create appointments for themselves or admin/medical staff to create for others
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === user_model_1.UserRole.PATIENT &&
            ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) !== patientId) {
            res.status(403).json({ message: 'Not authorized to create appointment for another patient' });
            return;
        }
        // Verify doctor exists and is a doctor
        const doctor = await user_model_1.default.findById(doctorId);
        if (!doctor || doctor.role !== user_model_1.UserRole.DOCTOR) {
            res.status(400).json({ message: 'Invalid doctor ID' });
            return;
        }
        // Verify patient exists
        const patient = await user_model_1.default.findById(patientId);
        if (!patient) {
            res.status(400).json({ message: 'Invalid patient ID' });
            return;
        }
        // If this is a telehealth appointment, verify doctor supports telehealth
        if (isVirtual && !((_c = doctor.professionalProfile) === null || _c === void 0 ? void 0 : _c.telehealth)) {
            res.status(400).json({ message: 'Selected doctor does not support telehealth appointments' });
            return;
        }
        // Check if doctor is available at the requested time
        const conflictingAppointment = await appointment_model_1.default.findOne({
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
            status: { $in: [appointment_model_1.AppointmentStatus.PENDING, appointment_model_1.AppointmentStatus.CONFIRMED] }
        });
        if (conflictingAppointment) {
            res.status(400).json({ message: 'Doctor is not available at the requested time' });
            return;
        }
        // Create appointment
        const appointment = new appointment_model_1.default({
            patient: patientId,
            doctor: doctorId,
            date: new Date(date),
            startTime,
            endTime,
            status: appointment_model_1.AppointmentStatus.PENDING,
            reason,
            notes,
            isVirtual: isVirtual || false,
            createdBy: (_d = req.user) === null || _d === void 0 ? void 0 : _d.id,
        });
        // Process uploaded attachments
        if (req.files && Array.isArray(req.files)) {
            const attachmentPaths = req.files.map((file) => `/uploads/${file.filename}`);
            appointment.attachments = attachmentPaths;
        }
        await appointment.save();
        res.status(201).json({
            message: 'Appointment created successfully',
            appointment,
        });
    }
    catch (error) {
        console.error('Create appointment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createAppointment = createAppointment;
// Get appointment by ID
const getAppointmentById = async (req, res) => {
    var _a, _b, _c, _d;
    try {
        const appointmentId = req.params.id;
        const appointment = await appointment_model_1.default.findById(appointmentId)
            .populate('patient', 'firstName lastName email profilePhoto')
            .populate('doctor', 'firstName lastName email department specialization profilePhoto');
        if (!appointment) {
            res.status(404).json({ message: 'Appointment not found' });
            return;
        }
        // Check if user has permission to view this appointment
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === user_model_1.UserRole.PATIENT &&
            appointment.patient._id.toString() !== ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
            res.status(403).json({ message: 'Not authorized to view this appointment' });
            return;
        }
        if (((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) === user_model_1.UserRole.DOCTOR &&
            appointment.doctor._id.toString() !== ((_d = req.user) === null || _d === void 0 ? void 0 : _d.id)) {
            res.status(403).json({ message: 'Not authorized to view this appointment' });
            return;
        }
        res.status(200).json({ appointment });
    }
    catch (error) {
        console.error('Get appointment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAppointmentById = getAppointmentById;
// Get appointments for a user
const getUserAppointments = async (req, res) => {
    var _a, _b;
    try {
        const userId = req.params.userId;
        const { status, startDate, endDate } = req.query;
        // Only allow users to view their own appointments, unless they are medical staff or admin
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== userId &&
            ![user_model_1.UserRole.ADMIN, user_model_1.UserRole.DOCTOR, user_model_1.UserRole.NURSE].includes((_b = req.user) === null || _b === void 0 ? void 0 : _b.role)) {
            res.status(403).json({ message: 'Not authorized to view these appointments' });
            return;
        }
        // Find the user to determine role
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Build query based on user role
        let query = {};
        if (user.role === user_model_1.UserRole.PATIENT) {
            query.patient = userId;
        }
        else if (user.role === user_model_1.UserRole.DOCTOR) {
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
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
            }
        }
        const appointments = await appointment_model_1.default.find(query)
            .populate('patient', 'firstName lastName email profilePhoto')
            .populate('doctor', 'firstName lastName email department specialization profilePhoto')
            .sort({ date: 1, startTime: 1 });
        res.status(200).json({ appointments });
    }
    catch (error) {
        console.error('Get user appointments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserAppointments = getUserAppointments;
// Update appointment status
const updateAppointmentStatus = async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    try {
        const { status } = req.body;
        const appointmentId = req.params.id;
        // Find appointment to update and populate patient and doctor fields
        const appointmentDoc = await appointment_model_1.default.findById(appointmentId)
            .populate('patient', 'firstName lastName email')
            .populate('doctor', 'firstName lastName email');
        if (!appointmentDoc) {
            res.status(404).json({ message: 'Appointment not found' });
            return;
        }
        // Cast to a properly typed appointment object
        const appointment = appointmentDoc;
        // Check if user has permission to update this appointment
        const isDoctor = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === user_model_1.UserRole.DOCTOR && appointment.doctor._id.toString() === ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        const isPatient = ((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) === user_model_1.UserRole.PATIENT && appointment.patient._id.toString() === ((_d = req.user) === null || _d === void 0 ? void 0 : _d.id);
        const isAdminOrNurse = [user_model_1.UserRole.ADMIN, user_model_1.UserRole.NURSE].includes((_e = req.user) === null || _e === void 0 ? void 0 : _e.role);
        if (!isDoctor && !isPatient && !isAdminOrNurse) {
            res.status(403).json({ message: 'Not authorized to update this appointment' });
            return;
        }
        // Check for valid status
        if (!Object.values(appointment_model_1.AppointmentStatus).includes(status)) {
            res.status(400).json({ message: 'Invalid appointment status' });
            return;
        }
        // Certain status changes should only be allowed by specific roles
        if (status === appointment_model_1.AppointmentStatus.CONFIRMED && !isDoctor && !isAdminOrNurse) {
            res.status(403).json({ message: 'Only doctors, nurses, or admin can confirm appointments' });
            return;
        }
        if (status === appointment_model_1.AppointmentStatus.COMPLETED && !isDoctor && !isAdminOrNurse) {
            res.status(403).json({ message: 'Only doctors, nurses, or admin can mark appointments as completed' });
            return;
        }
        // Set appointment status
        appointment.status = status;
        appointment.updatedBy = (0, mongoose_utils_1.toObjectId)(((_f = req.user) === null || _f === void 0 ? void 0 : _f.id) || '');
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
        const formatDate = (date) => {
            return new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };
        switch (status) {
            case appointment_model_1.AppointmentStatus.CONFIRMED:
                // Appointment confirmed
                patientNotificationTitle = 'Appointment Confirmed';
                if (appointment.isVirtual) {
                    patientNotificationMessage = `Your telehealth appointment with Dr. ${doctorData.lastName} on ${formatDate(appointment.date)} at ${appointment.startTime} has been confirmed.`;
                }
                else {
                    patientNotificationMessage = `Your appointment with Dr. ${doctorData.lastName} on ${formatDate(appointment.date)} at ${appointment.startTime} has been confirmed.`;
                }
                // If patient is confirming, send notification to doctor
                if (isPatient) {
                    if (appointment.isVirtual) {
                        doctorNotificationTitle = 'Telehealth Appointment Confirmed';
                        doctorNotificationMessage = `Telehealth appointment with ${patientData.firstName} ${patientData.lastName} on ${formatDate(appointment.date)} at ${appointment.startTime} has been confirmed.`;
                    }
                    else {
                        doctorNotificationTitle = 'Appointment Confirmed';
                        doctorNotificationMessage = `Appointment with ${patientData.firstName} ${patientData.lastName} on ${formatDate(appointment.date)} at ${appointment.startTime} has been confirmed.`;
                    }
                }
                break;
            case appointment_model_1.AppointmentStatus.CANCELLED:
                // Appointment cancelled - notify other party
                if (((_g = req.user) === null || _g === void 0 ? void 0 : _g.role) === user_model_1.UserRole.DOCTOR) {
                    patientNotificationTitle = 'Appointment Cancelled';
                    patientNotificationMessage = `Your appointment with Dr. ${doctorData.lastName} on ${formatDate(appointment.date)} at ${appointment.startTime} has been cancelled by the doctor.`;
                }
                else if (((_h = req.user) === null || _h === void 0 ? void 0 : _h.role) === user_model_1.UserRole.PATIENT) {
                    doctorNotificationTitle = 'Appointment Cancelled';
                    doctorNotificationMessage = `The appointment with ${patientData.firstName} ${patientData.lastName} on ${formatDate(appointment.date)} at ${appointment.startTime} has been cancelled by the patient.`;
                }
                break;
            case appointment_model_1.AppointmentStatus.RESCHEDULED:
                // Appointment rescheduled - notify other party
                if (((_j = req.user) === null || _j === void 0 ? void 0 : _j.role) === user_model_1.UserRole.DOCTOR) {
                    patientNotificationTitle = 'Appointment Rescheduled';
                    patientNotificationMessage = `Your appointment with Dr. ${doctorData.lastName} has been rescheduled to ${formatDate(appointment.date)} at ${appointment.startTime}.`;
                }
                else if (((_k = req.user) === null || _k === void 0 ? void 0 : _k.role) === user_model_1.UserRole.PATIENT) {
                    doctorNotificationTitle = 'Appointment Rescheduled';
                    doctorNotificationMessage = `The appointment with ${patientData.firstName} ${patientData.lastName} has been rescheduled to ${formatDate(appointment.date)} at ${appointment.startTime}.`;
                }
                break;
            case appointment_model_1.AppointmentStatus.COMPLETED:
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
    }
    catch (error) {
        console.error('Update appointment status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateAppointmentStatus = updateAppointmentStatus;
// Update appointment details
const updateAppointment = async (req, res) => {
    var _a, _b, _c, _d, _e;
    try {
        const appointmentId = req.params.id;
        const { date, startTime, endTime, reason, notes, } = req.body;
        const appointment = await appointment_model_1.default.findById(appointmentId);
        if (!appointment) {
            res.status(404).json({ message: 'Appointment not found' });
            return;
        }
        // Check if the user has permission to update the appointment
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === user_model_1.UserRole.PATIENT &&
            appointment.patient.toString() !== ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
            res.status(403).json({ message: 'Not authorized to update this appointment' });
            return;
        }
        if (((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) === user_model_1.UserRole.DOCTOR &&
            appointment.doctor.toString() !== ((_d = req.user) === null || _d === void 0 ? void 0 : _d.id)) {
            res.status(403).json({ message: 'Not authorized to update this appointment' });
            return;
        }
        // If rescheduling, check for conflicts
        if (date && startTime && endTime) {
            const conflictingAppointment = await appointment_model_1.default.findOne({
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
                status: { $in: [appointment_model_1.AppointmentStatus.PENDING, appointment_model_1.AppointmentStatus.CONFIRMED] }
            });
            if (conflictingAppointment) {
                res.status(400).json({ message: 'Doctor is not available at the requested time' });
                return;
            }
            appointment.date = new Date(date);
            appointment.startTime = startTime;
            appointment.endTime = endTime;
            appointment.status = appointment_model_1.AppointmentStatus.RESCHEDULED;
        }
        // Update other fields
        if (reason)
            appointment.reason = reason;
        if (notes)
            appointment.notes = notes;
        appointment.updatedBy = (0, mongoose_utils_1.toObjectId)((_e = req.user) === null || _e === void 0 ? void 0 : _e.id);
        // Process uploaded attachments
        if (req.files && Array.isArray(req.files)) {
            const attachmentPaths = req.files.map((file) => `/uploads/${file.filename}`);
            appointment.attachments = [...(appointment.attachments || []), ...attachmentPaths];
        }
        await appointment.save();
        res.status(200).json({
            message: 'Appointment updated successfully',
            appointment,
        });
    }
    catch (error) {
        console.error('Update appointment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateAppointment = updateAppointment;
// Get all appointments (admin only)
const getAllAppointments = async (req, res) => {
    var _a;
    try {
        // Only admin and nurses can get all appointments
        if (![user_model_1.UserRole.ADMIN, user_model_1.UserRole.NURSE].includes((_a = req.user) === null || _a === void 0 ? void 0 : _a.role)) {
            res.status(403).json({ message: 'Not authorized to access this resource' });
            return;
        }
        const { status, doctor, patient, department, startDate, endDate } = req.query;
        let query = {};
        // Apply filters
        if (status)
            query.status = status;
        if (doctor)
            query.doctor = doctor;
        if (patient)
            query.patient = patient;
        // Filter by date range
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
            }
        }
        // For department filter, we need to join with the users collection
        let appointments;
        if (department) {
            // Find doctors in the specified department
            const doctors = await user_model_1.default.find({
                role: user_model_1.UserRole.DOCTOR,
                department
            }).select('_id');
            const doctorIds = doctors.map(d => d._id);
            // Add doctor filter
            query.doctor = { $in: doctorIds };
        }
        appointments = await appointment_model_1.default.find(query)
            .populate('patient', 'firstName lastName email profilePhoto')
            .populate('doctor', 'firstName lastName email department specialization profilePhoto')
            .sort({ date: 1, startTime: 1 });
        res.status(200).json({ appointments });
    }
    catch (error) {
        console.error('Get all appointments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllAppointments = getAllAppointments;
// Delete appointment (admin only)
const deleteAppointment = async (req, res) => {
    var _a;
    try {
        // Only admin can delete appointments
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== user_model_1.UserRole.ADMIN) {
            res.status(403).json({ message: 'Not authorized to delete appointments' });
            return;
        }
        const appointmentId = req.params.id;
        const appointment = await appointment_model_1.default.findById(appointmentId);
        if (!appointment) {
            res.status(404).json({ message: 'Appointment not found' });
            return;
        }
        // Delete attachments if any
        if (appointment.attachments && appointment.attachments.length > 0) {
            for (const attachment of appointment.attachments) {
                const filePath = path_1.default.join(__dirname, '../../uploads', path_1.default.basename(attachment));
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                }
            }
        }
        await appointment_model_1.default.findByIdAndDelete(appointmentId);
        res.status(200).json({ message: 'Appointment deleted successfully' });
    }
    catch (error) {
        console.error('Delete appointment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteAppointment = deleteAppointment;
// Get available time slots for a doctor on a specific date
const getAvailableSlots = async (req, res) => {
    try {
        const { doctor: doctorId, date } = req.query;
        if (!doctorId || !date) {
            res.status(400).json({ message: 'Doctor ID and date are required' });
            return;
        }
        // Verify doctor exists and is a doctor
        const doctor = await user_model_1.default.findById(doctorId);
        if (!doctor || doctor.role !== user_model_1.UserRole.DOCTOR) {
            res.status(400).json({ message: 'Invalid doctor ID' });
            return;
        }
        // Define working hours (8 AM to 5 PM, 30 minute increments)
        const workingHours = {
            start: 8, // 8 AM
            end: 17, // 5 PM
        };
        // Generate all possible time slots
        const allTimeSlots = [];
        for (let hour = workingHours.start; hour < workingHours.end; hour++) {
            allTimeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
            allTimeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        // Find existing appointments for the doctor on the specified date
        const existingAppointments = await appointment_model_1.default.find({
            doctor: doctorId,
            date: new Date(date),
            status: { $in: [appointment_model_1.AppointmentStatus.PENDING, appointment_model_1.AppointmentStatus.CONFIRMED] },
        }).sort({ startTime: 1 });
        // Filter out time slots that are already booked
        const availableSlots = allTimeSlots.filter(slot => {
            // Check if this slot overlaps with any existing appointment
            return !existingAppointments.some(appointment => {
                return ((slot >= appointment.startTime && slot < appointment.endTime) ||
                    // Don't allow booking the last slot of the day since it needs an end time
                    (slot === allTimeSlots[allTimeSlots.length - 1]));
            });
        });
        res.status(200).json({ availableSlots });
    }
    catch (error) {
        console.error('Get available slots error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAvailableSlots = getAvailableSlots;
// Add meeting link to telehealth appointment (doctor only)
const updateMeetingLink = async (req, res) => {
    var _a;
    try {
        const appointmentId = req.params.id;
        const { meetingLink } = req.body;
        if (!meetingLink) {
            res.status(400).json({ message: 'Meeting link is required' });
            return;
        }
        // Find appointment
        const appointment = await appointment_model_1.default.findById(appointmentId);
        if (!appointment) {
            res.status(404).json({ message: 'Appointment not found' });
            return;
        }
        // Only doctors can update the meeting link for their own appointments
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== user_model_1.UserRole.DOCTOR ||
            appointment.doctor.toString() !== req.user.id) {
            res.status(403).json({ message: 'Not authorized to update meeting link' });
            return;
        }
        // Verify this is a telehealth appointment
        if (!appointment.isVirtual) {
            res.status(400).json({ message: 'Cannot add meeting link to non-telehealth appointment' });
            return;
        }
        // Verify the appointment is confirmed
        if (appointment.status !== appointment_model_1.AppointmentStatus.CONFIRMED) {
            res.status(400).json({ message: 'Can only add meeting link to confirmed appointments' });
            return;
        }
        // Update the meeting link
        appointment.meetingLink = meetingLink;
        appointment.updatedBy = (0, mongoose_utils_1.toObjectId)(req.user.id);
        await appointment.save();
        // Notify the patient about the updated meeting link
        // ... notification implementation ...
        res.status(200).json({
            message: 'Meeting link updated successfully',
            appointment,
        });
    }
    catch (error) {
        console.error('Update meeting link error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateMeetingLink = updateMeetingLink;
