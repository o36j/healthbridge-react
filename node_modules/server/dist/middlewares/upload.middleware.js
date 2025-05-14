"use strict";
/**
 * File Upload Middleware
 *
 * This module provides middleware functions for handling file uploads using multer.
 * It supports different types of file uploads with appropriate validation:
 * - Profile photos (images only)
 * - Appointment attachments (images and documents)
 * - Patient history attachments (images and documents)
 *
 * The uploaded files are stored in the 'uploads' directory with unique filenames.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMessageAttachments = exports.uploadPatientHistoryAttachments = exports.uploadAppointmentAttachments = exports.uploadProfilePhoto = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(__dirname, '..', '..', 'uploads');
// Create uploads directory if it doesn't exist
if (!fs_1.default.existsSync(uploadsDir)) {
    try {
        fs_1.default.mkdirSync(uploadsDir, { recursive: true });
    }
    catch (error) {
        // Error creating uploads directory
    }
}
/**
 * Multer storage configuration
 * - Determines where files are stored
 * - Generates unique filenames to prevent collisions
 */
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        // Generate unique filename using timestamp and random number
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path_1.default.extname(file.originalname);
        const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
        cb(null, filename);
    },
});
/**
 * Filter function that only allows image files
 * Used for profile photo uploads
 */
const imageFilter = (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files are allowed!'));
    }
};
/**
 * Filter function that allows both image and document files
 * Used for appointment and patient history attachments
 */
const documentFilter = (_req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image and document files are allowed!'));
    }
};
/**
 * Error handling middleware for multer errors
 * Provides user-friendly error messages for upload failures
 */
const multerErrorHandler = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
    else if (err) {
        return res.status(400).json({ message: err.message || 'Error uploading file' });
    }
    next();
};
/**
 * Multer configuration for profile photo uploads
 * - Single file upload
 * - Image files only
 * - 5MB file size limit
 */
const multerUpload = (0, multer_1.default)({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max size
    },
}).single('profilePhoto');
/**
 * Middleware for handling profile photo uploads
 * Wraps multer with additional error handling
 */
const uploadProfilePhoto = (req, res, next) => {
    multerUpload(req, res, (err) => {
        if (err) {
            return multerErrorHandler(err, req, res, next);
        }
        next();
    });
};
exports.uploadProfilePhoto = uploadProfilePhoto;
/**
 * Middleware for handling appointment attachments
 * - Multiple files (up to 5)
 * - Allows images and documents
 * - 10MB file size limit per file
 */
exports.uploadAppointmentAttachments = (0, multer_1.default)({
    storage,
    fileFilter: documentFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max size
    },
}).array('attachments', 5); // Maximum 5 attachments
/**
 * Middleware for handling patient history attachments
 * - Multiple files (up to 10)
 * - Allows images and documents
 * - 10MB file size limit per file
 */
exports.uploadPatientHistoryAttachments = (0, multer_1.default)({
    storage,
    fileFilter: documentFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max size
    },
}).array('attachments', 10); // Maximum 10 attachments
// Upload message attachments
exports.uploadMessageAttachments = (0, multer_1.default)({
    storage,
    fileFilter: documentFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max size
    },
}).array('attachments', 5); // Allow up to 5 files per message 
