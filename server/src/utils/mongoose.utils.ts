import mongoose from 'mongoose';

/**
 * Converts string IDs to MongoDB ObjectIds safely
 * @param id - A string ID, ObjectId, or undefined/null value
 * @returns ObjectId or undefined
 */
export function toObjectId(id: string | mongoose.Types.ObjectId | undefined | null): mongoose.Types.ObjectId | undefined {
  if (!id) return undefined;
  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
}

/**
 * Checks if a value is a valid MongoDB ObjectId
 * @param id - Any value to check
 * @returns boolean indicating if the value is a valid ObjectId
 */
export function isValidObjectId(id: any): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Type guard to check if a value is a MongoDB ObjectId
 * @param value - Any value to check
 * @returns boolean indicating if the value is an ObjectId
 */
export function isObjectId(value: any): value is mongoose.Types.ObjectId {
  return value instanceof mongoose.Types.ObjectId;
} 