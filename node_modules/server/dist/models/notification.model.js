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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var NotificationType;
(function (NotificationType) {
    NotificationType["APPOINTMENT_CREATED"] = "appointment_created";
    NotificationType["APPOINTMENT_UPDATED"] = "appointment_updated";
    NotificationType["APPOINTMENT_CANCELLED"] = "appointment_cancelled";
    NotificationType["APPOINTMENT_REMINDER"] = "appointment_reminder";
    NotificationType["APPOINTMENT_CONFIRMED"] = "appointment_confirmed";
    NotificationType["MESSAGE_RECEIVED"] = "message_received";
    NotificationType["LAB_RESULTS"] = "lab_results";
    NotificationType["PRESCRIPTION"] = "prescription";
    NotificationType["SYSTEM"] = "system";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
const notificationSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: Object.values(NotificationType),
        required: true,
    },
    read: {
        type: Boolean,
        default: false,
    },
    relatedId: {
        type: mongoose_1.Schema.Types.ObjectId,
        refPath: 'relatedModel',
    },
    relatedModel: {
        type: String,
        enum: ['Appointment', 'Message', 'PatientHistory'],
        validate: {
            validator: function (value) {
                // Only require relatedModel if relatedId is provided
                return this.relatedId ? !!value : true;
            },
            message: 'RelatedModel is required when relatedId is provided'
        }
    }
}, { timestamps: true });
// Create indexes for faster querying
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });
const Notification = mongoose_1.default.model('Notification', notificationSchema);
exports.default = Notification;
