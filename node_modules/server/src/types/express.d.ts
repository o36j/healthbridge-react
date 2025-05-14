import { Types } from 'mongoose';
import { UserRole } from '../models/user.model';

declare global {
  namespace Express {
    interface User {
      id: Types.ObjectId;
      email: string;
      role: UserRole;
      firstName?: string;
      lastName?: string;
    }
  }
} 