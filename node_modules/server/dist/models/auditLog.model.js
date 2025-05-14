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
exports.AuditAction = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var AuditAction;
(function (AuditAction) {
    AuditAction["USER_CREATED"] = "user_created";
    AuditAction["USER_UPDATED"] = "user_updated";
    AuditAction["USER_DELETED"] = "user_deleted";
    AuditAction["USER_STATUS_UPDATED"] = "user_status_updated";
    AuditAction["DOCTOR_RATING_UPDATED"] = "doctor_rating_updated";
    AuditAction["ROLE_UPDATED"] = "role_updated";
    AuditAction["PASSWORD_UPDATED"] = "password_updated";
    AuditAction["LOGIN_SUCCESS"] = "login_success";
    AuditAction["LOGIN_FAILED"] = "login_failed";
    AuditAction["LOGOUT"] = "logout";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
const auditLogSchema = new mongoose_1.Schema({
    action: {
        type: String,
        required: true,
        enum: Object.values(AuditAction),
    },
    performedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    performedOn: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    previousValue: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    newValue: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    details: {
        type: String,
    },
    ip: {
        type: String,
    },
    userAgent: {
        type: String,
    },
}, { timestamps: true });
// Index for faster querying
auditLogSchema.index({ action: 1, performedBy: 1, performedOn: 1 });
auditLogSchema.index({ createdAt: -1 });
const AuditLog = mongoose_1.default.model('AuditLog', auditLogSchema);
exports.default = AuditLog;
