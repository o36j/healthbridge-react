"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toObjectId = toObjectId;
exports.isValidObjectId = isValidObjectId;
exports.isObjectId = isObjectId;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Converts string IDs to MongoDB ObjectIds safely
 * @param id - A string ID, ObjectId, or undefined/null value
 * @returns ObjectId or undefined
 */
function toObjectId(id) {
    if (!id)
        return undefined;
    return typeof id === 'string' ? new mongoose_1.default.Types.ObjectId(id) : id;
}
/**
 * Checks if a value is a valid MongoDB ObjectId
 * @param id - Any value to check
 * @returns boolean indicating if the value is a valid ObjectId
 */
function isValidObjectId(id) {
    return mongoose_1.default.Types.ObjectId.isValid(id);
}
/**
 * Type guard to check if a value is a MongoDB ObjectId
 * @param value - Any value to check
 * @returns boolean indicating if the value is an ObjectId
 */
function isObjectId(value) {
    return value instanceof mongoose_1.default.Types.ObjectId;
}
