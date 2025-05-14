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

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (error) {
    // Error creating uploads directory
  }
}

/**
 * Multer storage configuration
 * - Determines where files are stored
 * - Generates unique filenames to prevent collisions
 */
const storage = multer.diskStorage({
  destination: (_req: Request, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req: Request, file, cb) => {
    // Generate unique filename using timestamp and random number
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

/**
 * Filter function that only allows image files
 * Used for profile photo uploads
 */
const imageFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

/**
 * Filter function that allows both image and document files
 * Used for appointment and patient history attachments
 */
const documentFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
  } else {
    cb(new Error('Only image and document files are allowed!'));
  }
};

/**
 * Error handling middleware for multer errors
 * Provides user-friendly error messages for upload failures
 */
const multerErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  } else if (err) {
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
const multerUpload = multer({
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
export const uploadProfilePhoto = (req: Request, res: Response, next: NextFunction) => {
  multerUpload(req, res, (err) => {
    if (err) {
      return multerErrorHandler(err, req, res, next);
    }
    next();
  });
};

/**
 * Middleware for handling appointment attachments
 * - Multiple files (up to 5)
 * - Allows images and documents
 * - 10MB file size limit per file
 */
export const uploadAppointmentAttachments = multer({
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
export const uploadPatientHistoryAttachments = multer({
  storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max size
  },
}).array('attachments', 10); // Maximum 10 attachments

// Upload message attachments
export const uploadMessageAttachments = multer({
  storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max size
  },
}).array('attachments', 5); // Allow up to 5 files per message 