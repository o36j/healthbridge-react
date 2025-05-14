"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const medication_controller_1 = require("../controllers/medication.controller");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Create a new medication
router.post('/', medication_controller_1.createMedication);
// Get all medications (with optional search)
router.get('/', medication_controller_1.getMedications);
// Get medication by ID
router.get('/:id', medication_controller_1.getMedicationById);
// Update medication by ID
router.put('/:id', medication_controller_1.updateMedication);
// Delete medication by ID (admin only)
router.delete('/:id', medication_controller_1.deleteMedication);
exports.default = router;
