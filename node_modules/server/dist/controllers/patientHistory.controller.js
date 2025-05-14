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
exports.getAllPatientHistoryRecords = exports.deletePatientHistory = exports.updatePatientHistory = exports.getPatientHistoryByPatient = exports.getPatientHistoryById = exports.createPatientHistory = void 0;
const patientHistory_model_1 = __importDefault(require("../models/patientHistory.model"));
const user_model_1 = __importStar(require("../models/user.model"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mongoose_utils_1 = require("../utils/mongoose.utils");
// Create patient history record
const createPatientHistory = async (req, res) => {
    var _a, _b;
    try {
        const { patientId, doctorId, visitDate, diagnosis, symptoms, notes, vitals, prescriptions, followUpDate, } = req.body;
        // Validate required fields
        if (!patientId || !doctorId || !diagnosis || !notes) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        // Only doctors, nurses, and admins can create patient history records
        if (![user_model_1.UserRole.DOCTOR, user_model_1.UserRole.NURSE, user_model_1.UserRole.ADMIN].includes((_a = req.user) === null || _a === void 0 ? void 0 : _a.role)) {
            res.status(403).json({ message: 'Not authorized to create patient history records' });
            return;
        }
        // Verify patient exists
        const patient = await user_model_1.default.findById(patientId);
        if (!patient || patient.role !== user_model_1.UserRole.PATIENT) {
            res.status(400).json({ message: 'Invalid patient ID' });
            return;
        }
        // Verify doctor exists
        const doctor = await user_model_1.default.findById(doctorId);
        if (!doctor || doctor.role !== user_model_1.UserRole.DOCTOR) {
            res.status(400).json({ message: 'Invalid doctor ID' });
            return;
        }
        // Create patient history record
        const patientHistory = new patientHistory_model_1.default({
            patient: patientId,
            doctor: doctorId,
            visitDate: visitDate ? new Date(visitDate) : new Date(),
            diagnosis,
            symptoms: symptoms || [],
            notes,
            vitals: vitals || {},
            prescriptions: prescriptions || [],
            followUpDate: followUpDate ? new Date(followUpDate) : undefined,
            createdBy: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
        });
        // Process uploaded attachments
        if (req.files && Array.isArray(req.files)) {
            const attachmentPaths = req.files.map((file) => `/uploads/${file.filename}`);
            patientHistory.attachments = attachmentPaths;
        }
        await patientHistory.save();
        res.status(201).json({
            message: 'Patient history record created successfully',
            patientHistory,
        });
    }
    catch (error) {
        console.error('Create patient history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createPatientHistory = createPatientHistory;
// Get patient history record by ID
const getPatientHistoryById = async (req, res) => {
    var _a, _b;
    try {
        const recordId = req.params.id;
        const patientHistory = await patientHistory_model_1.default.findById(recordId)
            .populate('patient', 'firstName lastName email profilePhoto medicalRecordNumber')
            .populate('doctor', 'firstName lastName email department specialization profilePhoto');
        if (!patientHistory) {
            res.status(404).json({ message: 'Patient history record not found' });
            return;
        }
        // Patients can only view their own records
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === user_model_1.UserRole.PATIENT &&
            patientHistory.patient._id.toString() !== ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
            res.status(403).json({ message: 'Not authorized to view this record' });
            return;
        }
        res.status(200).json({ patientHistory });
    }
    catch (error) {
        console.error('Get patient history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getPatientHistoryById = getPatientHistoryById;
// Get all patient history records for a patient
const getPatientHistoryByPatient = async (req, res) => {
    var _a, _b;
    try {
        const patientId = req.params.patientId;
        // Patients can only view their own records
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === user_model_1.UserRole.PATIENT && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) !== patientId) {
            res.status(403).json({ message: 'Not authorized to view these records' });
            return;
        }
        // Verify patient exists
        const patient = await user_model_1.default.findById(patientId);
        if (!patient) {
            res.status(404).json({ message: 'Patient not found' });
            return;
        }
        const patientHistory = await patientHistory_model_1.default.find({ patient: patientId })
            .populate('doctor', 'firstName lastName email department specialization profilePhoto')
            .sort({ visitDate: -1 });
        res.status(200).json({ patientHistory });
    }
    catch (error) {
        console.error('Get patient history by patient error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getPatientHistoryByPatient = getPatientHistoryByPatient;
// Update patient history record
const updatePatientHistory = async (req, res) => {
    var _a, _b;
    try {
        const recordId = req.params.id;
        // Only doctors, nurses, and admins can update patient history records
        if (![user_model_1.UserRole.DOCTOR, user_model_1.UserRole.NURSE, user_model_1.UserRole.ADMIN].includes((_a = req.user) === null || _a === void 0 ? void 0 : _a.role)) {
            res.status(403).json({ message: 'Not authorized to update patient history records' });
            return;
        }
        const patientHistory = await patientHistory_model_1.default.findById(recordId);
        if (!patientHistory) {
            res.status(404).json({ message: 'Patient history record not found' });
            return;
        }
        const { diagnosis, symptoms, notes, vitals, prescriptions, followUpDate, } = req.body;
        // Update fields
        if (diagnosis)
            patientHistory.diagnosis = diagnosis;
        if (symptoms)
            patientHistory.symptoms = symptoms;
        if (notes)
            patientHistory.notes = notes;
        if (vitals)
            patientHistory.vitals = { ...patientHistory.vitals, ...vitals };
        if (prescriptions)
            patientHistory.prescriptions = prescriptions;
        if (followUpDate)
            patientHistory.followUpDate = new Date(followUpDate);
        // Update updatedBy field
        patientHistory.updatedBy = (0, mongoose_utils_1.toObjectId)((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        // Process uploaded attachments
        if (req.files && Array.isArray(req.files)) {
            const attachmentPaths = req.files.map((file) => `/uploads/${file.filename}`);
            patientHistory.attachments = [...(patientHistory.attachments || []), ...attachmentPaths];
        }
        await patientHistory.save();
        res.status(200).json({
            message: 'Patient history record updated successfully',
            patientHistory,
        });
    }
    catch (error) {
        console.error('Update patient history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updatePatientHistory = updatePatientHistory;
// Delete patient history record (admin only)
const deletePatientHistory = async (req, res) => {
    var _a;
    try {
        // Only admin can delete patient history records
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== user_model_1.UserRole.ADMIN) {
            res.status(403).json({ message: 'Not authorized to delete patient history records' });
            return;
        }
        const recordId = req.params.id;
        const patientHistory = await patientHistory_model_1.default.findById(recordId);
        if (!patientHistory) {
            res.status(404).json({ message: 'Patient history record not found' });
            return;
        }
        // Delete attachments if any
        if (patientHistory.attachments && patientHistory.attachments.length > 0) {
            for (const attachment of patientHistory.attachments) {
                const filePath = path_1.default.join(__dirname, '../../uploads', path_1.default.basename(attachment));
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                }
            }
        }
        await patientHistory_model_1.default.findByIdAndDelete(recordId);
        res.status(200).json({ message: 'Patient history record deleted successfully' });
    }
    catch (error) {
        console.error('Delete patient history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deletePatientHistory = deletePatientHistory;
// Get all patient history records (admin only)
const getAllPatientHistoryRecords = async (req, res) => {
    var _a, _b;
    try {
        // Only admin, doctors, and nurses can get all patient history records
        if (![user_model_1.UserRole.ADMIN, user_model_1.UserRole.DOCTOR, user_model_1.UserRole.NURSE].includes((_a = req.user) === null || _a === void 0 ? void 0 : _a.role)) {
            res.status(403).json({ message: 'Not authorized to access this resource' });
            return;
        }
        const { patient, doctor, startDate, endDate, diagnosis } = req.query;
        let query = {};
        // Apply filters
        if (patient)
            query.patient = patient;
        if (doctor)
            query.doctor = doctor;
        // Filter by date range
        if (startDate || endDate) {
            query.visitDate = {};
            if (startDate) {
                query.visitDate.$gte = new Date(startDate);
            }
            if (endDate) {
                query.visitDate.$lte = new Date(endDate);
            }
        }
        // Filter by diagnosis
        if (diagnosis) {
            query.diagnosis = { $regex: diagnosis, $options: 'i' };
        }
        // Doctors can only see their patients' records
        if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === user_model_1.UserRole.DOCTOR) {
            query.doctor = req.user.id;
        }
        const patientHistory = await patientHistory_model_1.default.find(query)
            .populate('patient', 'firstName lastName email profilePhoto medicalRecordNumber')
            .populate('doctor', 'firstName lastName email department specialization profilePhoto')
            .sort({ visitDate: -1 });
        res.status(200).json({ patientHistory });
    }
    catch (error) {
        console.error('Get all patient history records error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllPatientHistoryRecords = getAllPatientHistoryRecords;
