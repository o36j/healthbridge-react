"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMedication = exports.updateMedication = exports.getMedicationById = exports.getMedications = exports.createMedication = void 0;
const medication_model_1 = __importDefault(require("../models/medication.model"));
const user_model_1 = require("../models/user.model");
const mongoose_utils_1 = require("../utils/mongoose.utils");
// Create a new medication
const createMedication = async (req, res) => {
    try {
        // Only doctors, pharmacists, and admins can create medications
        if (!req.user || ![user_model_1.UserRole.DOCTOR, user_model_1.UserRole.ADMIN, user_model_1.UserRole.NURSE].includes(req.user.role)) {
            res.status(403).json({ message: 'Not authorized to create medications' });
            return;
        }
        const { name, description, warnings, sideEffects, dosageForm, strength, manufacturer, } = req.body;
        if (!name) {
            res.status(400).json({ message: 'Medication name is required' });
            return;
        }
        // Check if medication already exists
        const existingMedication = await medication_model_1.default.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existingMedication) {
            res.status(400).json({ message: 'A medication with this name already exists' });
            return;
        }
        const medication = new medication_model_1.default({
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
    }
    catch (error) {
        console.error('Create medication error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createMedication = createMedication;
// Get all medications with optional search
const getMedications = async (req, res) => {
    try {
        const { search, page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
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
        const medications = await medication_model_1.default.find(query)
            .sort({ name: 1 })
            .skip(skip)
            .limit(limitNum);
        const total = await medication_model_1.default.countDocuments(query);
        res.status(200).json({
            medications,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error('Get medications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getMedications = getMedications;
// Get medication by ID
const getMedicationById = async (req, res) => {
    try {
        const { id } = req.params;
        const medication = await medication_model_1.default.findById(id);
        if (!medication) {
            res.status(404).json({ message: 'Medication not found' });
            return;
        }
        res.status(200).json({ medication });
    }
    catch (error) {
        console.error('Get medication by ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getMedicationById = getMedicationById;
// Update medication
const updateMedication = async (req, res) => {
    try {
        // Only doctors, pharmacists, and admins can update medications
        if (!req.user || ![user_model_1.UserRole.DOCTOR, user_model_1.UserRole.ADMIN, user_model_1.UserRole.NURSE].includes(req.user.role)) {
            res.status(403).json({ message: 'Not authorized to update medications' });
            return;
        }
        const { id } = req.params;
        const { name, description, warnings, sideEffects, dosageForm, strength, manufacturer, } = req.body;
        const medication = await medication_model_1.default.findById(id);
        if (!medication) {
            res.status(404).json({ message: 'Medication not found' });
            return;
        }
        // Update fields if provided
        if (name)
            medication.name = name;
        if (description !== undefined)
            medication.description = description;
        if (warnings)
            medication.warnings = warnings;
        if (sideEffects)
            medication.sideEffects = sideEffects;
        if (dosageForm !== undefined)
            medication.dosageForm = dosageForm;
        if (strength !== undefined)
            medication.strength = strength;
        if (manufacturer !== undefined)
            medication.manufacturer = manufacturer;
        medication.updatedBy = (0, mongoose_utils_1.toObjectId)(req.user.id);
        await medication.save();
        res.status(200).json({
            message: 'Medication updated successfully',
            medication,
        });
    }
    catch (error) {
        console.error('Update medication error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateMedication = updateMedication;
// Delete medication (admin only)
const deleteMedication = async (req, res) => {
    try {
        // Only admins can delete medications
        if (!req.user || req.user.role !== user_model_1.UserRole.ADMIN) {
            res.status(403).json({ message: 'Not authorized to delete medications' });
            return;
        }
        const { id } = req.params;
        const medication = await medication_model_1.default.findById(id);
        if (!medication) {
            res.status(404).json({ message: 'Medication not found' });
            return;
        }
        await medication.deleteOne();
        res.status(200).json({
            message: 'Medication deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete medication error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteMedication = deleteMedication;
