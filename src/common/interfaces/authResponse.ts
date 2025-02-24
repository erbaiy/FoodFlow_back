import { HttpStatus } from '@nestjs/common';
import { ObjectId } from 'mongoose';

export interface AuthResponse {
  status: HttpStatus;
  data: {
    message?: string;
    userId?: string; // Corrected line
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  };
}